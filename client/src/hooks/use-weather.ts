import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

// Frontend upload payload — date is ISO string after flexible parsing
export type WeatherUploadPayload = {
  date: string;
  temperature: number;
  rainfall: number;
  humidity: number;
};

export function useWeatherStats() {
  return useQuery({
    queryKey: [api.weather.stats.path],
    queryFn: async () => {
      const res = await fetch(api.weather.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch weather statistics");
      return api.weather.stats.responses[200].parse(await res.json());
    },
  });
}

export function useWeatherList() {
  return useQuery({
    queryKey: [api.weather.list.path],
    queryFn: async () => {
      const res = await fetch(api.weather.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch weather data");
      return api.weather.list.responses[200].parse(await res.json());
    },
  });
}

export function useUploadWeather() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: WeatherUploadPayload[]) => {
      // Validate data before sending if needed, but endpoint also validates
      // We assume data is already transformed to correct shape
      const res = await fetch(api.weather.upload.path, {
        method: api.weather.upload.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
           const error = api.weather.upload.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to upload data");
      }
      return api.weather.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.weather.stats.path] });
      queryClient.invalidateQueries({ queryKey: [api.weather.list.path] });
    },
  });
}

export function useClearWeather() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.weather.clear.path, {
        method: api.weather.clear.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to clear data");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.weather.stats.path] });
      queryClient.invalidateQueries({ queryKey: [api.weather.list.path] });
    },
  });
}

export function usePredictWeather() {
  return useMutation({
    mutationFn: async (data: { year: number; month: number }) => {
      const res = await fetch(api.weather.predict.path, {
        method: api.weather.predict.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to generate prediction");
      return api.weather.predict.responses[200].parse(await res.json());
    },
  });
}
