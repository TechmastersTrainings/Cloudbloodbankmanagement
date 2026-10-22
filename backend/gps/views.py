#C:\Users\sachi\PycharmProjects\cloud_bloodbank_backendmanage\gps\views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle
from gps.services.gps_locator import find_nearest_hospitals
from gps.serializers import NearbyHospitalSerializer

class NearbyHospitalLocator(APIView):
    """
    Real-time hospital locator using OpenStreetMap and blood stock data.
    Endpoint: /api/gps/nearby/?lat=17.91&lon=77.52&blood_group=O+&radius=50
    """
    throttle_scope = 'search'
    throttle_classes = [ScopedRateThrottle]

    def get(self, request):
        try:
            lat = request.query_params.get("lat")
            lon = request.query_params.get("lon")
            blood_group = request.query_params.get("blood_group")
            radius = float(request.query_params.get("radius", 50))

            if not (lat and lon and blood_group):
                return Response(
                    {"error": "lat, lon, and blood_group are required parameters."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Call service
            results = find_nearest_hospitals(float(lat), float(lon), blood_group, radius)

            if not results:
                return Response(
                    {"message": "No hospitals found within the specified radius."},
                    status=status.HTTP_200_OK
                )

            # Serialize output data using instance= not data=
            serializer = NearbyHospitalSerializer(instance=results, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except ValueError:
            return Response({"error": "Invalid coordinates."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
