import { Slot, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import { BottomNavigation, useTheme } from 'react-native-paper';

export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const routes = [
    { 
      key: 'index',
      title: 'Início',
      focusedIcon: 'home',
      unfocusedIcon: 'home-outline',
    },
    {
      key: 'medicines',
      title: 'Remédios',
      focusedIcon: 'pill',
      unfocusedIcon: 'pill',
    },
    {
      key: 'pharmacies',
      title: 'Farmácias',
      focusedIcon: 'store',
      unfocusedIcon: 'store-outline',
    },
    {
      key: 'profile',
      title: 'Perfil',
      focusedIcon: 'account',
      unfocusedIcon: 'account-outline',
    }
  ];

  const getRouteIndex = () => {
    const currentPath = pathname.split('/').pop() || '';
    return Math.max(routes.findIndex(route => 
      currentPath === (route.key === 'index' ? '' : route.key)
    ), 0);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <BottomNavigation
        navigationState={{
          index: getRouteIndex(),
          routes
        }}
        onIndexChange={(index) => {
          const route = routes[index];
          const path = route.key === 'index' ? '/' : `/${route.key}`;
          router.push(path as any);
        }}
        renderScene={() => null}
      />
    </View>
  );
} 