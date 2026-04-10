import React from 'react';
import { Card, Typography, Divider } from 'antd';

const { Title, Text, Paragraph } = Typography;

const EFFECTIVE_DATE = 'April 1, 2026';

export default function PrivacyPolicy({ variant = 'page' }) {
  const isModal = variant === 'modal';

  const content = (
    <Typography>
          <Title level={2} className="!mb-1">
            Growlio Privacy Policy (GDPR-Compliant)
          </Title>
          <Text type="secondary">Effective Date: {EFFECTIVE_DATE}</Text>

          <Divider />

          <Paragraph>
            <Text strong>Company:</Text> Growlio, LLC
            <br />
            <Text strong>Website:</Text> www.growlio.ai
            <br />
            <Text strong>Contact:</Text> support@growlio.ai
          </Paragraph>

          <Title level={4}>1. Introduction</Title>
          <Paragraph>
            Growlio, LLC is committed to protecting your personal data and complying with applicable data protection
            laws, including the GDPR.
          </Paragraph>

          <Title level={4}>2. Data Controller</Title>
          <Paragraph>
            Growlio, LLC is the data controller responsible for your personal data.
          </Paragraph>

          <Title level={4}>3. Information We Collect</Title>
          <Paragraph>
            We collect contact information, business data, financial and operational data, and usage data.
          </Paragraph>

          <Title level={4}>4. How We Use Data</Title>
          <Paragraph>
            We use your data to operate the platform, generate insights, provide support, and improve services.
          </Paragraph>

          <Title level={4}>5. Legal Basis for Processing</Title>
          <Paragraph>
            We process data under contractual necessity, legitimate interests, consent, and legal obligations.
          </Paragraph>

          <Title level={4}>6. Data Sharing</Title>
          <Paragraph>
            We do not sell your data. We may share data with service providers and infrastructure partners under
            strict confidentiality.
          </Paragraph>

          <Title level={4}>7. International Transfers</Title>
          <Paragraph>
            Data may be transferred outside your jurisdiction with appropriate safeguards.
          </Paragraph>

          <Title level={4}>8. Data Retention</Title>
          <Paragraph>
            We retain data only as long as necessary for service delivery and legal compliance.
          </Paragraph>

          <Title level={4}>9. Your Rights</Title>
          <Paragraph>
            You have the right to access, correct, delete, or request portability of your data.
          </Paragraph>

          <Title level={4}>10. Cookies</Title>
          <Paragraph>
            We use cookies to improve functionality and user experience.
          </Paragraph>

          <Title level={4}>11. Data Security</Title>
          <Paragraph>
            We implement encryption, access controls, and secure infrastructure.
          </Paragraph>

          <Title level={4}>12. Children’s Data</Title>
          <Paragraph>
            Growlio is not intended for users under 18.
          </Paragraph>

          <Title level={4}>13. Changes to This Policy</Title>
          <Paragraph>
            We may update this Privacy Policy from time to time.
          </Paragraph>

          <Title level={4}>14. Contact</Title>
          <Paragraph>
            support@growlio.ai
            <br />
            www.growlio.ai
            <br />
            Growlio, LLC
          </Paragraph>
        </Typography>
  );

  if (isModal) return content;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <Card className="shadow-lg border border-gray-100 rounded-xl">
        {content}
      </Card>
    </div>
  );
}

