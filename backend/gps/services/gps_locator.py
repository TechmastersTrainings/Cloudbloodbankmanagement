import requests
import logging
from geopy.distance import geodesic
from hospital.models import HospitalProfile
from blood.models import BloodStock
from django.db.models import Prefetch

logger = logging.getLogger(__name__)


def find_nearest_hospitals(user_lat, user_lon, blood_group, radius_km=50):
    """
    Finds hospitals within radius. 
    Includes hospitals with 0 stock so the UI can show 'No Stock Available'.
    Optimized with prefetch_related to avoid N+1 queries.
    """
    # Prefetch blood stock for the specific blood group in a single query
    blood_stock_prefetch = Prefetch(
        'blood_stock_entries',
        queryset=BloodStock.objects.filter(blood_group=blood_group),
        to_attr='filtered_stock'
    )
    
    hospitals = HospitalProfile.objects.filter(
        is_verified=True
    ).prefetch_related(blood_stock_prefetch)
    
    available_list = []

    for hospital in hospitals:
        try:
            # 1. Auto-fetch GPS if missing (Nominatim API)
            if not hospital.latitude or not hospital.longitude:
                query = f"{hospital.address}, {hospital.city}, {hospital.state}"
                try:
                    response = requests.get(
                        "https://nominatim.openstreetmap.org/search",
                        params={"q": query, "format": "json", "limit": 1},
                        headers={"User-Agent": "CloudBloodBank/1.0"},
                        timeout=5
                    )
                    data = response.json()
                    if data:
                        hospital.latitude = float(data[0]["lat"])
                        hospital.longitude = float(data[0]["lon"])
                        hospital.save(update_fields=["latitude", "longitude"])
                except Exception as api_err:
                    logger.warning(f"Failed to geocode {hospital.hospital_name}: {api_err}")
                    continue  # Skip if we can't get coordinates

            # 2. Skip if still no coordinates
            if not (hospital.latitude and hospital.longitude):
                continue

            # 3. Calculate Distance
            distance = geodesic((user_lat, user_lon), (hospital.latitude, hospital.longitude)).km
            if distance > radius_km:
                continue

            # 4. Check Stock (Include even if 0) - O(1) lookup from prefetched data
            stock = hospital.filtered_stock[0] if hospital.filtered_stock else None
            available_units = stock.quantity if stock else 0

            available_list.append({
                "hospital_id": hospital.id,
                "hospital_name": hospital.hospital_name,
                "hospital_type": hospital.hospital_type,
                "address": hospital.address,
                "city": hospital.city,
                "state": hospital.state,
                "pincode": hospital.pincode,
                "contact_person": hospital.contact_person,
                "contact_phone": hospital.contact_phone,
                "blood_group": blood_group,
                "available_units": available_units,
                "distance_km": round(distance, 2),
                "latitude": hospital.latitude,
                "longitude": hospital.longitude
            })

        except Exception as e:
            logger.error(f"[GPS ERROR] {hospital.hospital_name}: {e}")

    # Sort by distance (nearest first)
    available_list.sort(key=lambda x: x["distance_km"])
    return available_list