import { handler } from "../lambda-functions/getProductsList";
import { products as mockProducts } from "../lambda-functions/products";

describe("Get products list test", () => {
  it("should return a list of products", async () => {
    const event = {
      httpMethod: "GET",
      path: "/products",
    };
    const res = await handler(event);
    const products = JSON.parse(res.body);
    expect(products).toEqual(mockProducts);
  });
});
