import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/page';

// Mock child components to isolate the DashboardPage component
jest.mock('@/components/deck-card', () => ({
  DeckCard: ({ deck }: { deck: { id: string; name: string } }) => <div data-testid={`deck-card-${deck.id}`}>{deck.name}</div>,
}));

// Mock next/link
jest.mock('next/link', () => {
    return ({children, href}: {children: React.ReactNode, href: string}) => {
        return <a href={href}>{children}</a>
    }
});

describe('DashboardPage', () => {
  it('renders all main sections', () => {
    render(<DashboardPage />);

    // Check for section headings
    expect(screen.getByRole('heading', { name: /Flashcard Decks/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Grammar Lessons/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Quizzes/i })).toBeInTheDocument();
  });

  it('renders links to view all features', () => {
    render(<DashboardPage />);

    expect(screen.getByRole('link', { name: /View All Decks/i })).toHaveAttribute('href', '/decks');
    expect(screen.getByRole('link', { name: /View All Lessons/i })).toHaveAttribute('href', '/grammar');
    expect(screen.getByRole('link', { name: /View All Quizzes/i })).toHaveAttribute('href', '/quizzes');
  });

  it('renders featured decks', () => {
    render(<DashboardPage />);
    
    // Assuming basicDecks from data.ts is used
    expect(screen.getByText(/Hiragana Basics/i)).toBeInTheDocument();
    expect(screen.getByText(/Katakana Practice/i)).toBeInTheDocument();
  });

  it('renders featured grammar lessons', () => {
    render(<DashboardPage />);
    
    // Assuming grammarPoints from data.ts is used
    expect(screen.getByText(/AはBです \(A wa B desu\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Verb Conjugation \(ます-form\)/i)).toBeInTheDocument();
  });

   it('renders featured quizzes', () => {
    render(<DashboardPage />);
    
    // Assuming quizzes from data.ts is used
    expect(screen.getByText(/Beginner Grammar Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/N5 Vocabulary Quiz/i)).toBeInTheDocument();
  });
});
