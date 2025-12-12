import React from 'react';
import { render, screen } from '@testing-library/react';
import { GridBackground } from '@/components/effects/GridBackground';

const mockMesh = { setParent: jest.fn(), rotation: {} };

jest.mock('ogl', () => {
  const renderer = function () {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const gl = {
      canvas,
      clearColor: jest.fn(),
      getExtension: jest.fn(() => ({ loseContext: jest.fn() })),
    };
    return { gl, render: jest.fn(), setSize: jest.fn() };
  };

  const camera = function () {
    return { position: { set: jest.fn() }, perspective: jest.fn() };
  };

  const geometry = function () {};
  const program = function () {
    return {
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 1 },
        uNoise: { value: 0 },
        uHueShift: { value: 0 },
        uColorFrequency: { value: 1 },
        uGlow: { value: 1 },
      },
    };
  };
  const mesh = function () {
    return mockMesh;
  };
  const transform = function () {
    return {};
  };

  return {
    Renderer: renderer,
    Camera: camera,
    Geometry: geometry,
    Program: program,
    Mesh: mesh,
    Transform: transform,
  };
});

describe('Effects components', () => {
  it('renders grid background', () => {
    render(<GridBackground />);
    // root is absolute positioned div; ensure it exists
    const element = document.querySelector('.absolute');
    expect(element).toBeInTheDocument();
  });

  it('renders Prism placeholder without crashing', async () => {
    const Prism = (await import('@/components/effects/Prism')).default;
    const { container } = render(<Prism />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

