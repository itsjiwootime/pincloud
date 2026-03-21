import api from "../../services/api";
import { API_BASE_URL } from "../../constants/config";

describe("api instance", () => {
  it("uses the configured baseURL", () => {
    expect(api.defaults.baseURL).toBe(API_BASE_URL);
  });

  it("uses a 10 second timeout", () => {
    expect(api.defaults.timeout).toBe(10000);
  });
});
