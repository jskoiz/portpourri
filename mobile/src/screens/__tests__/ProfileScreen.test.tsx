import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import ProfileScreen from "../ProfileScreen";

const mockNavigate = jest.fn();
const mockLogout = jest.fn();
const mockDeleteAccount = jest.fn();
const mockGet = jest.fn();
const mockPut = jest.fn();
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

jest.mock("../../api/client", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({
      data: {
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
      },
    });
    mockPut.mockResolvedValue({ data: {} });
  });

  it("persists hydrated activity and schedule preferences when saving", async () => {
    render(<ProfileScreen />);

    expect(await screen.findByText("Jordan, 29")).toBeTruthy();
    expect(await screen.findByText(/Edit Profile/)).toBeTruthy();

    fireEvent.press(screen.getByText(/Edit Profile/));
    fireEvent.press(screen.getByText(/Save Changes/));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith("/profile/fitness", {
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
