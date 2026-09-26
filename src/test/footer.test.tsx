import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from '@/components/layout/Footer';
import ConditionalFooter from '@/components/layout/ConditionalFooter';

// Track current pathname mock
let currentPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Website Footer Implementation (Compact)', () => {
  beforeEach(() => {
    currentPathname = '/';
    vi.clearAllMocks();
  });

  describe('AC-1: Visibility and Layout Consistency', () => {
    it('renders the semantic footer element with contentinfo role', () => {
      render(<Footer />);
      const footerElement = screen.getByRole('contentinfo');
      expect(footerElement).toBeDefined();
      expect(footerElement.tagName.toLowerCase()).toBe('footer');
    });

    it('renders consistently on public homepage ("/")', () => {
      currentPathname = '/';
      const { container } = render(<ConditionalFooter />);
      const footerElement = container.querySelector('footer');
      expect(footerElement).not.toBeNull();
      expect(footerElement?.getAttribute('role')).toBe('contentinfo');
    });

    it('renders consistently on public offers page ("/offers")', () => {
      currentPathname = '/offers';
      const { container } = render(<ConditionalFooter />);
      const footerElement = container.querySelector('footer');
      expect(footerElement).not.toBeNull();
    });

    it('renders consistently on public products page ("/products")', () => {
      currentPathname = '/products';
      const { container } = render(<ConditionalFooter />);
      const footerElement = container.querySelector('footer');
      expect(footerElement).not.toBeNull();
    });

    it('renders consistently on legal pages ("/terms" and "/privacy")', () => {
      currentPathname = '/terms';
      const { container: termsContainer } = render(<ConditionalFooter />);
      expect(termsContainer.querySelector('footer')).not.toBeNull();

      currentPathname = '/privacy';
      const { container: privacyContainer } = render(<ConditionalFooter />);
      expect(privacyContainer.querySelector('footer')).not.toBeNull();
    });

    it('hides footer on dedicated auth pages to avoid distractions', () => {
      currentPathname = '/login';
      const { container: loginContainer } = render(<ConditionalFooter />);
      expect(loginContainer.querySelector('footer')).toBeNull();

      currentPathname = '/shop-registration';
      const { container: regContainer } = render(<ConditionalFooter />);
      expect(regContainer.querySelector('footer')).toBeNull();

      currentPathname = '/forgot-password';
      const { container: forgotContainer } = render(<ConditionalFooter />);
      expect(forgotContainer.querySelector('footer')).toBeNull();
    });

    it('hides footer on internal merchant shop-manager dashboard routes', () => {
      currentPathname = '/shop-manager';
      const { container: managerContainer } = render(<ConditionalFooter />);
      expect(managerContainer.querySelector('footer')).toBeNull();

      currentPathname = '/shop-manager/offers';
      const { container: managerOffersContainer } = render(<ConditionalFooter />);
      expect(managerOffersContainer.querySelector('footer')).toBeNull();
    });
  });

  describe('AC-2: Copyright Notice with Business Name and Active Year', () => {
    it('displays the current active year automatically', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear().toString();
      const copyrightElement = document.getElementById('footer-copyright');
      expect(copyrightElement).not.toBeNull();
      expect(copyrightElement?.textContent).toContain(currentYear);
    });

    it('displays the correct business name "OfferNearU"', () => {
      render(<Footer />);
      const copyrightElement = document.getElementById('footer-copyright');
      expect(copyrightElement).not.toBeNull();
      expect(copyrightElement?.textContent).toContain('OfferNearU');
      expect(copyrightElement?.textContent).toMatch(/©\s*\d{4}\s*OfferNearU\.\s*All rights reserved\./i);
    });
  });

  describe('AC-3: Clear Links Directing to Terms of Service & Privacy Policy', () => {
    it('includes a direct, accessible link to the Terms of Service page', () => {
      render(<Footer />);
      const termsLinks = screen.getAllByRole('link', { name: /terms/i });
      expect(termsLinks.length).toBeGreaterThan(0);
      
      const hasCorrectHref = termsLinks.some(link => link.getAttribute('href') === '/terms');
      expect(hasCorrectHref).toBe(true);
    });

    it('includes a direct, accessible link to the Privacy Policy page', () => {
      render(<Footer />);
      const privacyLinks = screen.getAllByRole('link', { name: /privacy/i });
      expect(privacyLinks.length).toBeGreaterThan(0);

      const hasCorrectHref = privacyLinks.some(link => link.getAttribute('href') === '/privacy');
      expect(hasCorrectHref).toBe(true);
    });
  });

  describe('Social Links & Interactivity', () => {
    it('provides external social media links with safe target and rel attributes', () => {
      render(<Footer />);
      const twitterLink = screen.getByLabelText(/follow offernearu on x/i);
      expect(twitterLink.getAttribute('target')).toBe('_blank');
      expect(twitterLink.getAttribute('rel')).toBe('noopener noreferrer');

      const instagramLink = screen.getByLabelText(/follow offernearu on instagram/i);
      expect(instagramLink.getAttribute('target')).toBe('_blank');
      expect(instagramLink.getAttribute('rel')).toBe('noopener noreferrer');

      const facebookLink = screen.getByLabelText(/follow offernearu on facebook/i);
      expect(facebookLink.getAttribute('target')).toBe('_blank');
      expect(facebookLink.getAttribute('rel')).toBe('noopener noreferrer');

      const linkedinLink = screen.getByLabelText(/follow offernearu on linkedin/i);
      expect(linkedinLink.getAttribute('target')).toBe('_blank');
      expect(linkedinLink.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('triggers window scrollTo when Back to Top button is clicked', () => {
      const scrollToSpy = vi.fn();
      window.scrollTo = scrollToSpy;

      render(<Footer />);
      const topButton = screen.getByLabelText(/back to top of page/i);
      fireEvent.click(topButton);

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });
});
