import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import ProfileScreen from "../ProfileScreen";

const mockNavigate = jest.fn();
const mockLogout = jest.fn();
const mockDeleteAccount = jest.fn();
const mockUpdateFitness = jest.fn();
const mockUpdateProfile = jest.fn();
const mockUploadPhoto = jest.fn();
const mockUpdatePhoto = jest.fn();
const mockDeletePhotoMutation = jest.fn();
const mockRefetch = jest.fn();
const mockProfile = {
  id: "user-1",
  firstName: "Jordan",
  age: 29,
  profile: { city: "Honolulu" },
  fitnessProfile: {
    intensityLevel: "moderate",
    weeklyFrequencyBand: "3-4",
    primaryGoal: "connection",
    favoriteActivities: "Running, Surfing",
    prefersMorning: true,
    prefersEvening: false,
  },
  photos: [],
};
let mockIsSavingFitness = false;
let mockIsSavingProfile = false;
const mockAuthState = {
  user: { id: "user-1", firstName: "Jordan" },
  logout: mockLogout,
  deleteAccount: mockDeleteAccount,
};

const mockNavigation = { navigate: mockNavigate } as any;
const mockProfileRoute = { key: 'You-1', name: 'You' } as any;

jest.mock("../../store/authStore", () => ({
  useAuthStore: (
    selector: (state: typeof mockAuthState) => unknown,
  ) => selector(mockAuthState),
}));

jest.mock("../../features/profile/hooks/useProfile", () => ({
  useProfile: () => ({
    error: null,
    isLoading: false,
    isRefetching: false,
    isSavingFitness: mockIsSavingFitness,
    isSavingProfile: mockIsSavingProfile,
    isUploadingPhoto: false,
    isUpdatingPhoto: false,
    isDeletingPhoto: false,
    profile: mockProfile,
    refetch: mockRefetch,
    updateFitness: mockUpdateFitness,
    updateProfile: mockUpdateProfile,
    uploadPhoto: mockUploadPhoto,
    updatePhoto: mockUpdatePhoto,
    deletePhoto: mockDeletePhotoMutation,
  }),
}));

jest.mock("../../features/locations/useKnownLocationSuggestions", () => ({
  useKnownLocationSuggestions: () => [],
}));

jest.mock("../../components/form/LocationField", () => {
  const React = require("react");
  const { Pressable, Text, TextInput, View } = require("react-native");

  type MockLocationFieldProps = {
    kind?: "place" | "city";
    onChangeText: (value: string) => void;
    placeholder: string;
    value?: string;
  };

  return {
    LocationField: ({
      kind = "place",
      onChangeText,
      placeholder,
      value = "",
    }: MockLocationFieldProps) => {
      const [draft, setDraft] = React.useState(value);

      return (
        <View>
          <TextInput
            placeholder={placeholder}
            value={draft}
            onChangeText={(next: string) => {
              setDraft(next);
              onChangeText(next);
            }}
          />
          {kind === "city" ? (
            <Pressable accessibilityRole="button" onPress={() => onChangeText("Kailua")}>
              <Text>Windward Oahu</Text>
            </Pressable>
          ) : null}
        </View>
      );
    },
  };
});

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSavingFitness = false;
    mockIsSavingProfile = false;
    mockUpdateFitness.mockResolvedValue(undefined);
    mockUpdateProfile.mockResolvedValue(undefined);
    mockRefetch.mockResolvedValue(undefined);
  });

  it("persists hydrated activity and schedule preferences when saving", async () => {
    render(<ProfileScreen navigation={mockNavigation} route={mockProfileRoute} />);

    expect(await screen.findByText("Jordan, 29")).toBeTruthy();
    expect(await screen.findByText(/Edit Profile/)).toBeTruthy();

    fireEvent.press(screen.getByText(/Edit Profile/));
    fireEvent.press(screen.getByText(/Save/));

    await waitFor(() => {
      expect(mockUpdateFitness).toHaveBeenCalledWith({
        intensityLevel: "moderate",
        weeklyFrequencyBand: "3-4",
        primaryGoal: "connection",
        favoriteActivities: "Running, Surfing",
        prefersMorning: true,
        prefersEvening: false,
      });
    });
  });

  it("does not render fake environment pills", async () => {
    render(<ProfileScreen navigation={mockNavigation} route={mockProfileRoute} />);

    fireEvent.press(screen.getByText(/Edit Profile/));

    expect(screen.queryByText("Outdoors")).toBeNull();
    expect(screen.queryByText("Gym")).toBeNull();
  });

  it('disables save while profile updates are in progress', async () => {
    const { rerender } = render(<ProfileScreen navigation={mockNavigation} route={mockProfileRoute} />);

    fireEvent.press(await screen.findByLabelText('Edit profile'));
    mockIsSavingFitness = true;
    rerender(<ProfileScreen navigation={mockNavigation} route={mockProfileRoute} />);

    expect(screen.getByLabelText('Save profile').props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByText('Saving...')).toBeTruthy();
  });

  it("uses the structured city picker when saving profile basics", async () => {
    render(<ProfileScreen navigation={mockNavigation} route={mockProfileRoute} />);

    expect(await screen.findByText("Jordan, 29")).toBeTruthy();
    fireEvent.press(screen.getByText(/Edit Profile/));
    fireEvent.changeText(screen.getByPlaceholderText("Honolulu"), "Kailua");
    fireEvent.press(screen.getByText("Windward Oahu"));
    fireEvent.press(screen.getByText(/Save/));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          city: "Kailua",
        }),
      );
    });
  });
});
