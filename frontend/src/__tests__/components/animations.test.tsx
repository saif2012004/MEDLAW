import React from 'react';
import { render, screen } from '@testing-library/react';
import { FadeIn } from '@/components/animations/FadeIn';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

describe('Animation components', () => {
  it('renders FadeIn children', () => {
    render(
      <FadeIn>
        <div>fade content</div>
      </FadeIn>
    );
    expect(screen.getByText('fade content')).toBeInTheDocument();
  });

  it('renders ScrollReveal children', () => {
    render(
      <ScrollReveal>
        <div>reveal content</div>
      </ScrollReveal>
    );
    expect(screen.getByText('reveal content')).toBeInTheDocument();
  });
});

