import { CommonActions } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { BottomNavigation } from "react-native-paper";
export default function TabsLayout() {
  const routes = [
    {
      key: "index",
      title: "Início",
      focusedIcon: "home",
      unfocusedIcon: "home-outline",
    },
    {
      key: "medicines",
      title: "Remédios",
      focusedIcon: "pill",
      unfocusedIcon: "pill",
    },
    {
      key: "pharmacies",
      title: "Farmácias",
      focusedIcon: "store",
      unfocusedIcon: "store-outline",
    },
    {
      key: "profile/index",
      title: "Perfil",
      focusedIcon: "account",
      unfocusedIcon: "account-outline",
    },
  ];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ navigation, state, insets }) => (
        <BottomNavigation.Bar
          navigationState={{
            index: state.index,
            routes,
          }}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            preventDefault();
            navigation.dispatch(
              CommonActions.navigate({
                name: route.key,
                merge: true,
              })
            );
          }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="medicines" />
      <Tabs.Screen name="pharmacies" />
      <Tabs.Screen name="profile/index" />
    </Tabs>
  );
}
