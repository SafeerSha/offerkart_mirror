import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfilePreferences } from "@/components/profile/ProfilePreferences";
import { UserProfileResponse } from "@/lib/types/profile";

describe("Profile Page Components", () => {
  const mockProfile: UserProfileResponse = {
    id: "user-123",
    full_name: "Rahul Sharma",
    email: "rahul@example.com",
    phone: "+91 9876543210",
    role: 1,
  };

  const mockMerchantProfile: UserProfileResponse = {
    id: "merchant-456",
    full_name: "Anita Roy",
    email: "anita@freshmart.com",
    phone: "+91 9123456789",
    business_name: "Fresh Mart Superstore",
    shopId: "shop-789",
    role: 2,
  };

  describe("ProfileHeader", () => {
    it("renders member profile information correctly", () => {
      render(<ProfileHeader profile={mockProfile} />);

      expect(screen.getByText("Rahul Sharma")).toBeDefined();
      expect(screen.getByText("rahul@example.com")).toBeDefined();
      expect(screen.getByText("+91 9876543210")).toBeDefined();
      expect(screen.getByText("Member")).toBeDefined();
      expect(screen.getByText("RS")).toBeDefined();
    });

    it("renders merchant profile with Store Partner badge", () => {
      render(<ProfileHeader profile={mockMerchantProfile} />);

      expect(screen.getByText("Anita Roy")).toBeDefined();
      expect(screen.getByText("Store Partner")).toBeDefined();
      expect(screen.getByText("Fresh Mart Superstore")).toBeDefined();
    });
  });

  describe("ProfilePreferences", () => {
    it("renders quick access bookmarks and sign out button", () => {
      render(<ProfilePreferences profile={mockProfile} />);

      expect(screen.getByText("My Favorites")).toBeDefined();
      expect(screen.getByText("Register Your Business")).toBeDefined();
      expect(screen.getByText("Sign Out of Account")).toBeDefined();
    });

    it("renders Shop Manager link for merchant", () => {
      render(<ProfilePreferences profile={mockMerchantProfile} />);

      expect(screen.getByText("Shop Manager")).toBeDefined();
    });
  });
});
