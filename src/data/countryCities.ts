import type { CitySuggestion } from "../types/weather";

type CountryCity = Omit<CitySuggestion, "id" | "label" | "country">;

export const COUNTRY_CITIES: Record<string, CountryCity[]> = {
  Pakistan: [
    { name: "Karachi", state: "Sindh", lat: 24.8607, lon: 67.0011 },
    { name: "Lahore", state: "Punjab", lat: 31.5204, lon: 74.3587 },
    { name: "Islamabad", lat: 33.6844, lon: 73.0479 },
    { name: "Hyderabad", state: "Sindh", lat: 25.396, lon: 68.3578 },
    { name: "Faisalabad", state: "Punjab", lat: 31.4504, lon: 73.135 },
    { name: "Multan", state: "Punjab", lat: 30.1575, lon: 71.5249 },
    { name: "Rawalpindi", state: "Punjab", lat: 33.5651, lon: 73.0169 },
    { name: "Peshawar", state: "Khyber Pakhtunkhwa", lat: 34.0151, lon: 71.5249 },
    { name: "Quetta", state: "Balochistan", lat: 30.1798, lon: 66.975 },
    { name: "Sialkot", state: "Punjab", lat: 32.4945, lon: 74.5229 },
    { name: "Gujranwala", state: "Punjab", lat: 32.1877, lon: 74.1945 },
    { name: "Sukkur", state: "Sindh", lat: 27.7052, lon: 68.8574 },
  ],
  India: [
    { name: "Mumbai", state: "Maharashtra", lat: 19.076, lon: 72.8777 },
    { name: "Delhi", lat: 28.6139, lon: 77.209 },
    { name: "Bangalore", state: "Karnataka", lat: 12.9716, lon: 77.5946 },
    { name: "Hyderabad", state: "Telangana", lat: 17.385, lon: 78.4867 },
    { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707 },
    { name: "Kolkata", state: "West Bengal", lat: 22.5726, lon: 88.3639 },
    { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lon: 72.5714 },
    { name: "Pune", state: "Maharashtra", lat: 18.5204, lon: 73.8567 },
  ],
  "United States": [
    { name: "New York", state: "New York", lat: 40.7128, lon: -74.006 },
    { name: "Los Angeles", state: "California", lat: 34.0522, lon: -118.2437 },
    { name: "Chicago", state: "Illinois", lat: 41.8781, lon: -87.6298 },
    { name: "Houston", state: "Texas", lat: 29.7604, lon: -95.3698 },
    { name: "Phoenix", state: "Arizona", lat: 33.4484, lon: -112.074 },
    { name: "Philadelphia", state: "Pennsylvania", lat: 39.9526, lon: -75.1652 },
    { name: "San Antonio", state: "Texas", lat: 29.4241, lon: -98.4936 },
    { name: "San Diego", state: "California", lat: 32.7157, lon: -117.1611 },
  ],
  "United Kingdom": [
    { name: "London", state: "England", lat: 51.5072, lon: -0.1276 },
    { name: "Manchester", state: "England", lat: 53.4808, lon: -2.2426 },
    { name: "Birmingham", state: "England", lat: 52.4862, lon: -1.8904 },
    { name: "Glasgow", state: "Scotland", lat: 55.8642, lon: -4.2518 },
    { name: "Edinburgh", state: "Scotland", lat: 55.9533, lon: -3.1883 },
    { name: "Liverpool", state: "England", lat: 53.4084, lon: -2.9916 },
  ],
  Canada: [
    { name: "Toronto", state: "Ontario", lat: 43.6532, lon: -79.3832 },
    { name: "Vancouver", state: "British Columbia", lat: 49.2827, lon: -123.1207 },
    { name: "Montreal", state: "Quebec", lat: 45.5019, lon: -73.5674 },
    { name: "Calgary", state: "Alberta", lat: 51.0447, lon: -114.0719 },
    { name: "Ottawa", state: "Ontario", lat: 45.4215, lon: -75.6972 },
  ],
  "United Arab Emirates": [
    { name: "Dubai", lat: 25.2048, lon: 55.2708 },
    { name: "Abu Dhabi", lat: 24.4539, lon: 54.3773 },
    { name: "Sharjah", lat: 25.3463, lon: 55.4209 },
    { name: "Ajman", lat: 25.4052, lon: 55.5136 },
  ],
  "Saudi Arabia": [
    { name: "Riyadh", lat: 24.7136, lon: 46.6753 },
    { name: "Jeddah", lat: 21.4858, lon: 39.1925 },
    { name: "Mecca", lat: 21.3891, lon: 39.8579 },
    { name: "Medina", lat: 24.5247, lon: 39.5692 },
    { name: "Dammam", lat: 26.4207, lon: 50.0888 },
  ],
  Bangladesh: [
    { name: "Dhaka", lat: 23.8103, lon: 90.4125 },
    { name: "Chittagong", lat: 22.3569, lon: 91.7832 },
    { name: "Sylhet", lat: 24.8949, lon: 91.8687 },
    { name: "Khulna", lat: 22.8456, lon: 89.5403 },
  ],
  Japan: [
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "Osaka", lat: 34.6937, lon: 135.5023 },
    { name: "Kyoto", lat: 35.0116, lon: 135.7681 },
    { name: "Yokohama", lat: 35.4437, lon: 139.638 },
    { name: "Sapporo", lat: 43.0618, lon: 141.3545 },
  ],
  Australia: [
    { name: "Sydney", state: "New South Wales", lat: -33.8688, lon: 151.2093 },
    { name: "Melbourne", state: "Victoria", lat: -37.8136, lon: 144.9631 },
    { name: "Brisbane", state: "Queensland", lat: -27.4698, lon: 153.0251 },
    { name: "Perth", state: "Western Australia", lat: -31.9523, lon: 115.8613 },
  ],
  Germany: [
    { name: "Berlin", lat: 52.52, lon: 13.405 },
    { name: "Munich", state: "Bavaria", lat: 48.1351, lon: 11.582 },
    { name: "Hamburg", lat: 53.5511, lon: 9.9937 },
    { name: "Frankfurt", state: "Hesse", lat: 50.1109, lon: 8.6821 },
  ],
  France: [
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
    { name: "Marseille", lat: 43.2965, lon: 5.3698 },
    { name: "Lyon", lat: 45.764, lon: 4.8357 },
    { name: "Toulouse", lat: 43.6047, lon: 1.4442 },
  ],
};

export const COUNTRY_NAMES = Object.keys(COUNTRY_CITIES);

export const getCitySuggestions = (
  country: string,
  query: string
): CitySuggestion[] => {
  const needle = query.trim().toLowerCase();
  const cities = COUNTRY_CITIES[country] || [];

  return cities
    .filter((city) => {
      if (!needle) return true;
      return (
        city.name.toLowerCase().includes(needle) ||
        city.state?.toLowerCase().includes(needle)
      );
    })
    .map((city) => ({
      ...city,
      country,
      id: `${country}-${city.name}-${city.state || ""}`.toLowerCase(),
      label: city.state ? `${city.name}, ${city.state}` : city.name,
    }));
};
