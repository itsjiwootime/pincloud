import {
  createSavedPlace,
  deleteSavedPlace,
  getSavedPlace,
  getSavedPlacesByBbox,
  updateSavedPlace,
} from "../../services/places";
import api from "../../services/api";
import { DEFAULT_PIN_COLOR } from "../../constants/config";

jest.mock("../../services/api", () => {
  const actual = jest.requireActual("../../services/api");

  return {
    __esModule: true,
    ...actual,
    default: {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

describe("places service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getSavedPlacesByBbox sends bbox as query params", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { success: true, message: "", data: [] },
    });

    await expect(getSavedPlacesByBbox("126,37,127,38")).resolves.toEqual([]);
    expect(mockedApi.get).toHaveBeenCalledWith("/api/saved-places", {
      params: { bbox: "126,37,127,38" },
    });
  });

  it("getSavedPlace maps category and source link fields", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: "",
        data: {
          id: 7,
          name: "Cafe",
          address: "Seoul",
          latitude: 37.5,
          longitude: 127.0,
          memo: "memo",
          visitStatus: "WANT",
          categoryId: 10,
          categoryName: "Coffee",
          colorCode: "#123456",
          originalUrl: "https://example.com",
          platform: "BLOG",
          thumbnailUrl: "https://example.com/thumb.jpg",
          createdAt: "2026-03-18T00:00:00Z",
        },
      },
    });

    await expect(getSavedPlace(7)).resolves.toEqual({
      id: 7,
      name: "Cafe",
      address: "Seoul",
      latitude: 37.5,
      longitude: 127.0,
      memo: "memo",
      visitStatus: "WANT",
      category: {
        id: 10,
        name: "Coffee",
        colorCode: "#123456",
      },
      sourceLinks: [
        {
          id: 7,
          originalUrl: "https://example.com",
          platform: "BLOG",
          thumbnailUrl: "https://example.com/thumb.jpg",
        },
      ],
      createdAt: "2026-03-18T00:00:00Z",
    });
  });

  it("createSavedPlace applies the default pin color when category color is absent", async () => {
    const request = {
      name: "Cafe",
      address: "Seoul",
      latitude: 37.5,
      longitude: 127.0,
      originalUrl: "https://example.com",
    };

    mockedApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "",
        data: {
          id: 9,
          name: "Cafe",
          address: "Seoul",
          latitude: 37.5,
          longitude: 127.0,
          memo: null,
          visitStatus: "VISITED",
          categoryId: 4,
          categoryName: "Dessert",
          colorCode: null,
          originalUrl: null,
          platform: null,
          thumbnailUrl: null,
          createdAt: "2026-03-18T00:00:00Z",
        },
      },
    });

    await expect(createSavedPlace(request)).resolves.toEqual({
      id: 9,
      name: "Cafe",
      address: "Seoul",
      latitude: 37.5,
      longitude: 127.0,
      memo: undefined,
      visitStatus: "VISITED",
      category: {
        id: 4,
        name: "Dessert",
        colorCode: DEFAULT_PIN_COLOR,
      },
      sourceLinks: undefined,
      createdAt: "2026-03-18T00:00:00Z",
    });
    expect(mockedApi.post).toHaveBeenCalledWith("/api/saved-places", request);
  });

  it("updateSavedPlace calls patch with id and payload", async () => {
    const request = { memo: "updated memo", visitStatus: "VISITED" as const };

    mockedApi.patch.mockResolvedValueOnce({
      data: {
        success: true,
        message: "",
        data: {
          id: 3,
          name: "Place",
          address: "Seoul",
          latitude: 37.5,
          longitude: 127.0,
          memo: "updated memo",
          visitStatus: "VISITED",
          createdAt: "2026-03-18T00:00:00Z",
        },
      },
    });

    await expect(updateSavedPlace(3, request)).resolves.toMatchObject({
      id: 3,
      memo: "updated memo",
      visitStatus: "VISITED",
    });
    expect(mockedApi.patch).toHaveBeenCalledWith("/api/saved-places/3", request);
  });

  it("deleteSavedPlace calls delete with id", async () => {
    mockedApi.delete.mockResolvedValueOnce({
      data: { success: true, message: "", data: null },
    });

    await expect(deleteSavedPlace(5)).resolves.toBeUndefined();
    expect(mockedApi.delete).toHaveBeenCalledWith("/api/saved-places/5");
  });
});
