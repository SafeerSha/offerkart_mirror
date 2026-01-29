"use client";

import { useState, useEffect } from "react";

const REGISTRATION_KEY = "offerkart_shop_registered";

export function useRegistration() {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedStatus = localStorage.getItem(REGISTRATION_KEY);
    setIsRegistered(storedStatus === "true");
    setIsLoading(false);
  }, []);

  const setRegistrationStatus = (status: boolean) => {
    localStorage.setItem(REGISTRATION_KEY, String(status));
    setIsRegistered(status);
  };

  return { isRegistered, isLoading, setRegistrationStatus };
}
