import { pack, unpack } from "./serialize";

describe("it should serialise javascript well", () => {
  const values = [1, "string", true, false, null, undefined];

  values.forEach((value) => {
    it(`should serialise ${value}`, () => {
      expect(unpack(pack(value))).toEqual(value);
    });
  });
});

// describe("it should be able to unfurl promisis", () => {
//   it("when it succeeds", async () => {
//     const value = await unpack(pack(Promise.resolve(1)));
//     expect(value).toEqual(1);
//   });

//   it("when it fails", async () => {
//     const fn = async () => {
//       throw new Error("fail");
//     };

//     const value = fn

//     const value = await unpack(pack(Promise.reject(new Error("fail"))));
//     expect(value).toEqual(new Error("fail"));
//   });
// });
