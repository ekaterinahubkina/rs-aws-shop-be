import { handler } from "../lambda-functions/getProductById";
import { products as mockProducts } from "../lambda-functions/products";

describe("Get product by id test", () => {
  it("should return a single product", async () => {
    const mockProduct = mockProducts[0];
    const event = {
      httpMethod: "GET",
      pathParameters: { id: mockProduct.id },
    };
    const res = await handler(event);
    const product = JSON.parse(res.body);
    expect(product).toEqual(mockProduct);
    expect(res.statusCode).toBe(200);
  });
});

describe("Get product by id not found", () => {
  it("should return a 404", async () => {
    const event = {
      httpMethod: "GET",
      pathParameters: { id: "some-invalid-id" },
    };
    const res = await handler(event);
    const message = JSON.parse(res.body);
    expect(message).toEqual({ message: "Product not found" });
    expect(res.statusCode).toBe(404);
  });
});
