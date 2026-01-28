import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, ArrowLeft, FileText, Scale, AlertTriangle, CreditCard, XCircle, RefreshCw, Gavel, Mail } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Goal Achiever Pro',
  description: 'Read our Terms of Service to understand your rights and responsibilities when using Goal Achiever Pro.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Target className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Goal Achiever Pro</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl py-16 px-4">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 13, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <div className="bg-muted/30 rounded-xl p-6 mb-8 border">
            <p className="text-sm text-muted-foreground m-0">
              Please read these Terms of Service carefully before using Goal Achiever Pro. By accessing
              or using our service, you agree to be bound by these terms.
            </p>
          </div>

          <Section icon={Scale} title="Acceptance of Terms">
            <p>
              By creating an account or using Goal Achiever Pro, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service and our Privacy Policy.
            </p>
            <p>
              If you do not agree to these terms, you may not access or use our services. We reserve
              the right to modify these terms at any time, and your continued use of the service
              constitutes acceptance of any changes.
            </p>
          </Section>

          <Section icon={FileText} title="Description of Service">
            <p>
              Goal Achiever Pro is a goal-setting and time-optimization web application designed to
              help users achieve their personal and professional objectives. Our service includes:
            </p>
            <ul>
              <li>Vision and SMART goal planning tools</li>
              <li>Time tracking and audit features</li>
              <li>Value Matrix for activity categorization</li>
              <li>Daily routines and Pomodoro timer</li>
              <li>Progress analytics and reporting</li>
              <li>AI-assisted goal generation and suggestions</li>
            </ul>
          </Section>

          <Section icon={AlertTriangle} title="User Responsibilities">
            <p>As a user of Goal Achiever Pro, you agree to:</p>
            <ul>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the service only for lawful purposes</li>
              <li>Not attempt to circumvent any security features</li>
              <li>Not interfere with or disrupt the service</li>
              <li>Not upload malicious code or harmful content</li>
              <li>Respect the intellectual property rights of others</li>
            </ul>
            <p>
              You are responsible for all activity that occurs under your account. Notify us
              immediately if you suspect unauthorized access.
            </p>
          </Section>

          <Section icon={CreditCard} title="Subscription and Payments">
            <p>
              Goal Achiever Pro offers free and paid subscription plans. For paid subscriptions:
            </p>
            <ul>
              <li><strong>Billing:</strong> Subscriptions are billed in advance on a monthly or yearly basis</li>
              <li><strong>Automatic Renewal:</strong> Subscriptions automatically renew unless cancelled</li>
              <li><strong>Price Changes:</strong> We may change prices with 30 days advance notice</li>
              <li><strong>Refunds:</strong> We offer a 30-day money-back guarantee for new subscriptions</li>
              <li><strong>Cancellation:</strong> You may cancel at any time; access continues until the end of the billing period</li>
            </ul>
            <p>
              All payments are processed securely through Stripe. We do not store your full credit card information.
            </p>
          </Section>

          <Section icon={XCircle} title="Termination">
            <p>We may terminate or suspend your account if you:</p>
            <ul>
              <li>Violate these Terms of Service</li>
              <li>Engage in fraudulent or illegal activity</li>
              <li>Fail to pay applicable fees</li>
              <li>Abuse or harass other users or our staff</li>
            </ul>
            <p>
              You may terminate your account at any time through your account settings. Upon
              termination, you may request export of your data within 30 days.
            </p>
          </Section>

          <Section icon={RefreshCw} title="Limitation of Liability">
            <p>
              Goal Achiever Pro is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that:
            </p>
            <ul>
              <li>The service will be uninterrupted or error-free</li>
              <li>Results obtained from the service will be accurate</li>
              <li>The service will meet your specific requirements</li>
            </ul>
            <p>
              To the maximum extent permitted by law, Goal Achiever Pro shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including loss of
              profits, data, or other intangible losses.
            </p>
          </Section>

          <Section icon={Gavel} title="Governing Law">
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws
              of the jurisdiction in which Goal Achiever Pro operates, without regard to conflict
              of law principles.
            </p>
            <p>
              Any disputes arising from these terms or your use of the service shall be resolved
              through binding arbitration, except where prohibited by law.
            </p>
          </Section>

          <Section icon={Mail} title="Contact Us">
            <p>
              If you have questions about these Terms of Service, please contact us:
            </p>
            <ul>
              <li>Email: legal@goalachiever.pro</li>
              <li>Through our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link></li>
            </ul>
          </Section>

          <div className="bg-muted/30 rounded-xl p-6 mt-8 border">
            <h3 className="font-display font-semibold mb-2 mt-0">Changes to These Terms</h3>
            <p className="text-sm text-muted-foreground m-0">
              We reserve the right to modify these Terms of Service at any time. We will provide
              notice of significant changes by email or through the service. Your continued use
              after changes become effective constitutes acceptance of the updated terms.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-8">
        <div className="container px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">Goal Achiever Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Goal Achiever Pro. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors text-foreground font-medium">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-display text-xl font-semibold m-0">{title}</h2>
      </div>
      {children}
    </section>
  );
}
