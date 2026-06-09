from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Tuple
from ortools.constraint_solver import routing_enums_pb2, pywrapcp
from math import radians, sin, cos, sqrt, atan2
from ..core.auth import get_current_user

router = APIRouter(prefix="/optimize", tags=["Route Optimization"])

class Location(BaseModel):
    name: str
    lat: float
    lng: float

class RouteRequest(BaseModel):
    locations: List[Location]   # index 0 = depot
    demands:   List[int]        # one per location (depot demand = 0)
    vehicle_count:    int   = 3
    vehicle_capacity: int   = 1000  # kg or units

def _haversine_km(a: Tuple[float, float], b: Tuple[float, float]) -> int:
    R = 6371
    lat1, lon1 = radians(a[0]), radians(a[1])
    lat2, lon2 = radians(b[0]), radians(b[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    return int(R * 2 * atan2(sqrt(h), sqrt(1 - h)))

def _build_distance_matrix(locations: List[Location]) -> List[List[int]]:
    coords = [(loc.lat, loc.lng) for loc in locations]
    n = len(coords)
    return [[_haversine_km(coords[i], coords[j]) for j in range(n)] for i in range(n)]

@router.post("/route")
async def optimize_route(req: RouteRequest, user=Depends(get_current_user)):
    n = len(req.locations)
    if n < 2:
        return {"status": "error", "message": "At least 2 locations required (depot + 1 stop)."}
    if len(req.demands) != n:
        return {"status": "error", "message": "demands list must match locations length."}

    dist_matrix = _build_distance_matrix(req.locations)
    manager = pywrapcp.RoutingIndexManager(n, req.vehicle_count, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        return dist_matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]

    transit_idx = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_idx)

    demand_callback = routing.RegisterUnaryTransitCallback(
        lambda i: req.demands[manager.IndexToNode(i)]
    )
    routing.AddDimensionWithVehicleCapacity(
        demand_callback, 0, [req.vehicle_capacity] * req.vehicle_count, True, "Capacity"
    )

    routing.AddDimension(transit_idx, 0, 100_000, True, "Distance")
    dist_dim = routing.GetDimensionOrDie("Distance")
    dist_dim.SetGlobalSpanCostCoefficient(100)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    params.time_limit.seconds = 5

    solution = routing.SolveWithParameters(params)
    if not solution:
        return {"status": "failed", "message": "No solution found. Try reducing stops or increasing vehicles."}

    routes = []
    total_distance = 0
    for v in range(req.vehicle_count):
        index = routing.Start(v)
        stops, dist = [], 0
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            stops.append({
                "name":   req.locations[node].name,
                "lat":    req.locations[node].lat,
                "lng":    req.locations[node].lng,
                "demand": req.demands[node],
            })
            next_index = solution.Value(routing.NextVar(index))
            dist += dist_matrix[manager.IndexToNode(index)][manager.IndexToNode(next_index)]
            index = next_index
        # add depot return
        stops.append({"name": req.locations[0].name, "lat": req.locations[0].lat, "lng": req.locations[0].lng, "demand": 0})
        if len(stops) > 2:  # only include vehicles with actual stops
            routes.append({"vehicle": v + 1, "stops": stops, "distance_km": dist})
            total_distance += dist

    return {
        "status": "success",
        "total_distance_km": total_distance,
        "vehicles_used": len(routes),
        "routes": routes,
    }
