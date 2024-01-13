import * as osu from 'node-os-utils'
import { Events } from "./events";

describe("events", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  })

  afterAll(() => {
    jest.useRealTimers();
  })

  it("should flush events when bufferFlushSize is reached", () => {
    const mockFn = jest.fn();
    const events = new Events(mockFn, {
      bufferFlushSize: 2,
    })
    expect(mockFn).toHaveBeenCalledTimes(0);
    events.push({ type: "functionInvocation", timestamp: new Date() });
    expect(mockFn).toHaveBeenCalledTimes(0);
    events.push({ type: "functionInvocation", timestamp: new Date() });
    expect(mockFn).toHaveBeenCalledTimes(1);
    events.push({ type: "functionInvocation", timestamp: new Date() });
    expect(mockFn).toHaveBeenCalledTimes(1);
    events.push({ type: "functionInvocation", timestamp: new Date() });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("should schedule a system probe", () => {
    const mockFn = jest.fn();
    osu.cpu.usage = mockFn.mockResolvedValue(0.5);

    const events = new Events(mockFn, {
      systemProbeInterval: 100,
    })

    events.startResourceProbe();
    expect(mockFn).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);

    events.stopResourceProbe();
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  })
});

