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
const mockAuthState = {
  user: { id: "user-1", firstName: "Jordan" },
  logout: mockLogout,
  deleteAccount: mockDeleteAccount,
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

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
    isSavingFitness: false,
    isSavingProfile: false,
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

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateFitness.mockResolvedValue(undefined);
    mockUpdateProfile.mockResolvedValue(undefined);
    mockRefetch.mockResolvedValue(undefined);
  });

  it("persists hydrated activity and schedule preferences when saving", async () => {
    render(<ProfileScreen />);

    expect(await screen.findByText("Jordan, 29")).toBeTruthy();
    expect(await screen.findByText(/Edit Profile/)).toBeTruthy();

    fireEvent.press(screen.getByText(/Edit Profile/));
    fireEvent.press(screen.getByText(/Save Changes/));

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

  it("renders environment preferences as read-only chips in edit mode", async () => {
    render(<ProfileScreen />);

    expect(await screen.findByText("Environment")).toBeTruthy();
    fireEvent.press(screen.getByText(/Edit Profile/));

    expect(screen.getByText("Outdoors")).toBeTruthy();
    expect(screen.getByText("Gym")).toBeTruthy();
    expect(screen.getByText("Pool")).toBeTruthy();
  });

  it("uses the structured city picker when saving profile basics", async () => {
    render(<ProfileScreen />);

    expect(await screen.findByText("Jordan, 29")).toBeTruthy();
    fireEvent.press(screen.getByText(/Edit Profile/));
    fireEvent.changeText(screen.getByPlaceholderText("Honolulu"), "Kailua");
    fireEvent.press(screen.getByText("Windward Oahu"));
    fireEvent.press(screen.getByText(/Save Changes/));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          city: "Kailua",
        }),
      );
    });
  });
});
