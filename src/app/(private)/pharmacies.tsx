import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Button, Text } from "react-native-paper";
import { LoadingScreen } from "../../components/LoadingScreen";
import { PharmacyCard } from "../../components/PharmacyCard";

interface Pharmacy {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  vicinity: string;
  phone?: string;
}

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export default function PharmaciesScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>({
    latitude: -28.6775,
    longitude: -49.3697,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg(
          "Permissão de localização negada. Não é possível buscar farmácias próximas."
        );
        setLoading(false);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Erro ao solicitar permissão de localização:", error);
      setErrorMsg("Erro ao solicitar permissão de localização.");
      setLoading(false);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      setLocation(currentLocation);
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });

      await searchPharmacies(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      setErrorMsg(
        "Erro ao obter sua localização. Verifique se o GPS está ativado."
      );
    } finally {
      setLoading(false);
    }
  };

  const searchPharmacies = async (latitude: number, longitude: number) => {
    try {
      const radius = 2000;
      const type = "pharmacy";
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.results) {
        const pharmaciesWithDetails = await Promise.all(
          data.results.map(async (place: any) => {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number&key=${GOOGLE_PLACES_API_KEY}`;
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();

            return {
              id: place.place_id,
              name: place.name,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              isOpen: place.opening_hours?.is_open ?? true,
              vicinity: place.vicinity,
              phone:
                detailsData.result?.formatted_phone_number ||
                "Telefone não disponível",
            };
          })
        );

        setPharmacies(pharmaciesWithDetails);
      }
    } catch (error) {
      console.error("Erro ao buscar farmácias:", error);
      setErrorMsg("Erro ao buscar farmácias próximas");
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  if (loading) {
    return <LoadingScreen message="Obtendo sua localização..." />;
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Button
            mode="contained"
            onPress={getCurrentLocation}
            style={styles.retryButton}
          >
            Tentar Novamente
          </Button>
        </View>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Localização não disponível</Text>
          <Button
            mode="contained"
            onPress={getCurrentLocation}
            style={styles.retryButton}
          >
            Obter Localização
          </Button>
        </View>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <Text variant="headlineMedium">
          Mapa disponível apenas em dispositivos móveis
        </Text>
        <Text style={{ marginTop: 10 }}>
          Por favor, acesse o aplicativo em um dispositivo Android ou iOS para
          visualizar o mapa de farmácias.
        </Text>
      </View>
    );
  }

  const openPharmacies = pharmacies.filter((pharmacy) => pharmacy.isOpen);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        onRegionChangeComplete={(region) => {
          setRegion(region);
        }}
      >
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Sua Localização"
          description="Você está aqui"
          pinColor="blue"
        />

        {openPharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            coordinate={{
              latitude: pharmacy.latitude,
              longitude: pharmacy.longitude,
            }}
            title={pharmacy.name}
            description={`${pharmacy.vicinity} - Aberta`}
            pinColor="green"
          />
        ))}
      </MapView>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Farmácias Abertas</Text>
        <ScrollView style={styles.scrollView}>
          {openPharmacies.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma farmácia aberta encontrada neste raio.
            </Text>
          ) : (
            openPharmacies.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy.id}
                name={pharmacy.name}
                vicinity={pharmacy.vicinity}
                phone={pharmacy.phone}
              />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    width: "100%",
    height: "45%",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 5,
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    fontSize: 16,
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
  },
  retryButton: {
    marginTop: 10,
  },
});
