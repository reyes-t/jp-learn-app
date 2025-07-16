import React from 'react';
import { render, screen } from '@testing-library/react';
import { DeckCard } from '@/components/deck-card';
import type { Deck } from '@/lib/types';

// Mock next/link
jest.mock('next/link', () => {
    return ({children, href}: {children: React.ReactNode, href: string}) => {
        return <a href={href}>{children}</a>
    }
});

const mockDeck: Deck = {
  id: 'test-deck',
  name: 'Test Deck Name',
  description: 'This is a test deck description.',
  cardCount: 10,
  isCustom: false,
};

const mockCustomDeck: Deck = {
  id: 'custom-deck',
  name: 'My Custom Deck',
  description: 'A deck created by a user.',
  cardCount: 5,
  isCustom: true,
};

describe('DeckCard', () => {
  it('renders the deck name, description, and card count', () => {
    render(<DeckCard deck={mockDeck} />);

    expect(screen.getByText('Test Deck Name')).toBeInTheDocument();
    expect(screen.getByText('This is a test deck description.')).toBeInTheDocument();
    expect(screen.getByText('10 cards')).toBeInTheDocument();
  });

  it('contains a link to the deck detail page', () => {
    render(<DeckCard deck={mockDeck} />);
    const link = screen.getByRole('link', { name: 'Test Deck Name' });
    expect(link).toHaveAttribute('href', '/decks/test-deck');
  });

  it('contains a link to the study page', () => {
    render(<DeckCard deck={mockDeck} />);
    const studyLink = screen.getByRole('link', { name: 'Study' });
    expect(studyLink).toHaveAttribute('href', '/decks/test-deck/study');
  });

  it('does not show a "Custom" badge for non-custom decks', () => {
    render(<DeckCard deck={mockDeck} />);
    const badge = screen.queryByText('Custom');
    expect(badge).not.toBeInTheDocument();
  });

  it('shows a "Custom" badge for custom decks', () => {
    render(<DeckCard deck={mockCustomDeck} />);
    const badge = screen.getByText('Custom');
    expect(badge).toBeInTheDocument();
  });
});
