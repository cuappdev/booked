import { Stack } from "expo-router";
import { colors } from './styles/theme';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: "Booked",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="space/[id]"
        options={{
          title: "Space Details",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
