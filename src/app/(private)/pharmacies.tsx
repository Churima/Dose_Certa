import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Card, Text } from 'react-native-paper';

interface Pharmacy {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  vicinity: string;
  phone?: string;
}

//infos mockadas
const CRICIUMA_LOCATION = {
  coords: {
    latitude: -28.6775,
    longitude: -49.3697,
    altitude: null,
    accuracy: 1,
    altitudeAccuracy: null,
    heading: null,
    speed: null
  },
  timestamp: Date.now()
};

const GOOGLE_PLACES_API_KEY = Constants.expoConfig?.extra?.googlePlacesApiKey;

export default function PharmaciesScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: CRICIUMA_LOCATION.coords.latitude,
    longitude: CRICIUMA_LOCATION.coords.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const searchPharmacies = async (latitude: number, longitude: number) => {
    try {
      const radius = 2000; 
      const type = 'pharmacy';
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
              phone: detailsData.result?.formatted_phone_number || 'Telefone não disponível'
            };
          })
        );

        setPharmacies(pharmaciesWithDetails);
      }
    } catch (error) {
      console.error('Erro ao buscar farmácias:', error);
      setErrorMsg('Erro ao buscar farmácias próximas');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLocation(CRICIUMA_LOCATION);
        await searchPharmacies(
          CRICIUMA_LOCATION.coords.latitude,
          CRICIUMA_LOCATION.coords.longitude
        );
      } catch (error) {
        setErrorMsg('Erro ao carregar localização');
      }
    })();
  }, []);

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <Text>Carregando localização...</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text variant="headlineMedium">Mapa disponível apenas em dispositivos móveis</Text>
        <Text style={{ marginTop: 10 }}>
          Por favor, acesse o aplicativo em um dispositivo Android ou iOS para visualizar o mapa de farmácias.
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
          title="Centro de Criciúma"
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
            <Text style={styles.emptyText}>Nenhuma farmácia aberta encontrada neste raio.</Text>
          ) : (
            openPharmacies.map((pharmacy) => (
              <Card key={pharmacy.id} style={styles.card}>
                <Card.Title title={pharmacy.name} />
                <Card.Content>
                  <Text>{pharmacy.vicinity}</Text>
                  <Text>{pharmacy.phone}</Text>
                </Card.Content>
              </Card>
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
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '45%',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 16,
  },
}); 