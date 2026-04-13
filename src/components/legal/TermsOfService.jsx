import React from 'react';
import { Card, Typography, Divider } from 'antd';

const { Title, Text, Paragraph } = Typography;

const EFFECTIVE_DATE = 'April 1, 2026';

export default function TermsOfService({ variant = 'page' }) {
  const isModal = variant === 'modal';

  const content = (
    <Typography>
          <Title level={2} className="!mb-1">
            Growlio Terms of Service
          </Title>
          <Text type="secondary">
            Effective Date: {EFFECTIVE_DATE}
          </Text>

          <Divider />

          <Paragraph>
            <Text strong>Company:</Text> Growlio, LLC
            <br />
            <Text strong>Website:</Text> app.growlio.ai
            <br />
            <Text strong>Contact:</Text> support@growlio.ai
          </Paragraph>

          <Title level={4}>1. Acceptance of Terms</Title>
          <Paragraph>
            By accessing or using Growlio, you agree to be bound by these Terms of Service (“Terms”). If you do
            not agree, you may not use the platform.
          </Paragraph>

          <Title level={4}>2. Description of Service</Title>
          <Paragraph>
            Growlio provides a software platform designed to help restaurant operators:
          </Paragraph>
          <ul className="list-disc pl-6">
            <li>Create and manage budgets</li>
            <li>Analyze financial and operational performance</li>
            <li>Receive AI-driven insights through LIO</li>
          </ul>
          <Paragraph className="!mt-3">
            Growlio is a decision-support tool, not a decision-maker.
          </Paragraph>

          <Title level={4}>3. Eligibility</Title>
          <Paragraph>
            You must be at least 18 years old and legally capable of entering into a binding agreement.
          </Paragraph>

          <Title level={4}>4. Account Registration and Responsibility</Title>
          <Paragraph>You agree to:</Paragraph>
          <ul className="list-disc pl-6">
            <li>Provide accurate and complete information</li>
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Be responsible for all activity under your account</li>
          </ul>
          <Paragraph className="!mt-3">
            Growlio is not responsible for unauthorized access resulting from your failure to secure your account.
          </Paragraph>

          <Title level={4}>5. Subscription and Billing</Title>
          <Paragraph>If you are on a paid plan:</Paragraph>
          <ul className="list-disc pl-6">
            <li>Fees are billed on a recurring basis (monthly or annually)</li>
            <li>All payments are non-refundable unless expressly stated otherwise</li>
            <li>Growlio may modify pricing with reasonable notice</li>
            <li>Failure to pay may result in suspension or termination of your account</li>
          </ul>

          <Title level={4}>6. User Data and Responsibility</Title>
          <Paragraph>You are solely responsible for:</Paragraph>
          <ul className="list-disc pl-6">
            <li>The accuracy of all data entered into Growlio</li>
            <li>Any decisions made based on Growlio’s outputs</li>
          </ul>
          <Paragraph className="!mt-3">
            Growlio does not verify or guarantee the accuracy of your data.
          </Paragraph>

          <Title level={4}>7. No Financial, Legal, or Accounting Advice</Title>
          <Paragraph>
            Growlio provides insights and recommendations for informational purposes only.
          </Paragraph>
          <Paragraph>Growlio does not provide:</Paragraph>
          <ul className="list-disc pl-6">
            <li>Financial advice</li>
            <li>Legal advice</li>
            <li>Accounting advice</li>
          </ul>
          <Paragraph className="!mt-3">
            You are responsible for consulting qualified professionals where appropriate.
          </Paragraph>

          <Title level={4}>8. AI Disclaimer (LIO)</Title>
          <Paragraph>Growlio includes AI-generated insights through LIO.</Paragraph>
          <Paragraph>You acknowledge that:</Paragraph>
          <ul className="list-disc pl-6">
            <li>AI outputs may be incomplete, inaccurate, or outdated</li>
            <li>Recommendations are provided for informational purposes only</li>
            <li>AI outputs should not be relied upon as the sole basis for decisions</li>
          </ul>
          <Paragraph className="!mt-3">All decisions remain your responsibility.</Paragraph>

          <Title level={4}>9. Acceptable Use</Title>
          <Paragraph>You agree not to:</Paragraph>
          <ul className="list-disc pl-6">
            <li>Use Growlio for any unlawful purpose</li>
            <li>Attempt to access, disrupt, or compromise system integrity</li>
            <li>Upload malicious code or harmful data</li>
            <li>Use the platform to build or support a competing product</li>
          </ul>

          <Title level={4}>10. Intellectual Property</Title>
          <Paragraph>
            All software, systems, algorithms, designs, and content within Growlio are the exclusive property of
            Growlio, LLC.
          </Paragraph>
          <Paragraph>You may not:</Paragraph>
          <ul className="list-disc pl-6">
            <li>Copy, reproduce, or distribute any part of the platform</li>
            <li>Reverse engineer or attempt to extract source code</li>
            <li>Use Growlio’s technology to create competing services</li>
          </ul>

          <Title level={4}>11. Third-Party Integrations</Title>
          <Paragraph>
            Growlio may integrate with third-party services (including POS systems and payment providers).
          </Paragraph>
          <Paragraph>Growlio is not responsible for:</Paragraph>
          <ul className="list-disc pl-6">
            <li>The performance, accuracy, or availability of third-party systems</li>
            <li>Data provided by third-party integrations</li>
          </ul>

          <Title level={4}>12. Service Availability</Title>
          <Paragraph>Growlio does not guarantee that the platform will be:</Paragraph>
          <ul className="list-disc pl-6">
            <li>Uninterrupted</li>
            <li>Error-free</li>
            <li>Fully secure at all times</li>
          </ul>
          <Paragraph className="!mt-3">
            We may modify, suspend, or discontinue any part of the service at any time without liability.
          </Paragraph>

          <Title level={4}>13. Disclaimer of Warranties</Title>
          <Paragraph>
            Growlio is provided “as is” and “as available.”
          </Paragraph>
          <Paragraph>
            To the maximum extent permitted by law, Growlio disclaims all warranties, express or implied, including:
          </Paragraph>
          <ul className="list-disc pl-6">
            <li>Merchantability</li>
            <li>Fitness for a particular purpose</li>
            <li>Non-infringement</li>
          </ul>

          <Title level={4}>14. Limitation of Liability</Title>
          <Paragraph>To the maximum extent permitted by law:</Paragraph>
          <Paragraph>Growlio, LLC shall not be liable for:</Paragraph>
          <ul className="list-disc pl-6">
            <li>Loss of profits</li>
            <li>Business interruption</li>
            <li>Loss of data</li>
            <li>Indirect, incidental, or consequential damages</li>
          </ul>
          <Paragraph className="!mt-3">
            In no event shall Growlio’s total liability exceed the amount paid by you to Growlio in the twelve (12)
            months preceding the claim.
          </Paragraph>

          <Title level={4}>15. Use at Your Own Risk</Title>
          <Paragraph>
            You acknowledge and agree that your use of Growlio and any decisions made based on its outputs are at
            your sole risk.
          </Paragraph>

          <Title level={4}>16. Indemnification</Title>
          <Paragraph>
            You agree to indemnify, defend, and hold harmless Growlio, LLC from any claims, damages, liabilities, or
            expenses arising from:
          </Paragraph>
          <ul className="list-disc pl-6">
            <li>Your use of the platform</li>
            <li>Your data</li>
            <li>Your business decisions</li>
          </ul>

          <Title level={4}>17. Termination</Title>
          <Paragraph>Growlio may suspend or terminate your account:</Paragraph>
          <ul className="list-disc pl-6">
            <li>At its sole discretion</li>
            <li>For violation of these Terms</li>
            <li>For non-payment</li>
            <li>If your use presents risk to the platform or other users</li>
          </ul>
          <Paragraph className="!mt-3">
            Termination may occur without prior notice and without liability.
          </Paragraph>

          <Title level={4}>18. Dispute Resolution and Arbitration</Title>
          <Paragraph>
            Any dispute arising out of or relating to these Terms shall be resolved exclusively through binding
            arbitration in the State of Michigan.
          </Paragraph>
          <Paragraph>You agree that:</Paragraph>
          <ul className="list-disc pl-6">
            <li>Arbitration will be conducted on an individual basis only</li>
            <li>You waive any right to a jury trial</li>
            <li>You waive any right to participate in class, collective, or representative actions</li>
          </ul>

          <Title level={4}>19. Governing Law</Title>
          <Paragraph>
            These Terms are governed by the laws of the State of Michigan, United States, without regard to conflict
            of law principles.
          </Paragraph>

          <Title level={4}>20. Changes to Terms</Title>
          <Paragraph>
            Growlio may update these Terms at any time. Continued use of the platform constitutes acceptance of the
            updated Terms.
          </Paragraph>

          <Title level={4}>21. Contact</Title>
          <Paragraph>
            <Text strong>Email:</Text> support@growlio.ai
            <br />
            <Text strong>Website:</Text> app.growlio.ai
            <br />
            <Text strong>Company:</Text> Growlio, LLC
          </Paragraph>
        </Typography>
  );

  if (isModal) {
    return content;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <Card className="shadow-lg border border-gray-100 rounded-xl">
        {content}
      </Card>
    </div>
  );
}

