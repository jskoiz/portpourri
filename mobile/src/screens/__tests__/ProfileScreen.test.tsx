import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import ProfileScreen from "../ProfileScreen";

const mockNavigate = jest.fn();
const mockLogout = jest.fn();
const mockDeleteAccount = jest.fn();
const mockUpdateFitness = jest.fn();
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
    profile: mockProfile,
    refetch: mockRefetch,
    updateFitness: mockUpdateFitness,
  }),
}));

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateFitness.mockResolvedValue(undefined);
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
});
