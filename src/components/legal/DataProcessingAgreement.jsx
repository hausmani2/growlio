import React from 'react';
import { Card, Typography, Divider } from 'antd';

const { Title, Text, Paragraph } = Typography;

const EFFECTIVE_DATE = 'April 1, 2026';

export default function DataProcessingAgreement({ variant = 'page' }) {
  const isModal = variant === 'modal';

  const content = (
    <Typography>
          <Title level={2} className="!mb-1">
            Growlio Data Processing Agreement (DPA)
          </Title>
          <Text type="secondary">Effective Date: {EFFECTIVE_DATE}</Text>

          <Divider />

          <Paragraph>
            <Text strong>Company:</Text> Growlio, LLC
            <br />
            <Text strong>Website:</Text> app.growlio.ai
            <br />
            <Text strong>Contact:</Text> support@growlio.ai
          </Paragraph>

          <Title level={4}>1. Definitions</Title>
          <ul className="list-disc pl-6">
            <li>
              <Text strong>Controller</Text> means the customer using Growlio services.
            </li>
            <li>
              <Text strong>Processor</Text> means Growlio, LLC.
            </li>
            <li>
              <Text strong>Personal Data</Text> means any information relating to an identifiable individual.
            </li>
            <li>
              <Text strong>Processing</Text> means any operation performed on Personal Data.
            </li>
          </ul>

          <Title level={4}>2. Scope and Roles</Title>
          <Paragraph>
            The Controller appoints Growlio as Processor to process Personal Data solely to provide Growlio services,
            including budgeting, analytics, and AI insights.
          </Paragraph>

          <Title level={4}>3. Types of Data Processed</Title>
          <Paragraph>
            Contact data, business data, financial and operational data, limited labor data, and usage data.
          </Paragraph>

          <Title level={4}>4. Processing Instructions</Title>
          <Paragraph>
            Growlio will process data only on documented instructions from the Controller and will not sell or misuse
            data.
          </Paragraph>

          <Title level={4}>5. Subprocessors</Title>
          <Paragraph>Growlio uses AWS, Cloudflare, Neon, GitHub, and Stripe.</Paragraph>
          <Paragraph>
            All subprocessors are contractually required to maintain appropriate data protection safeguards.
          </Paragraph>

          <Title level={4}>6. Security Measures</Title>
          <Paragraph>
            Growlio implements encryption, access controls, secure infrastructure, and monitoring systems.
          </Paragraph>

          <Title level={4}>7. Data Breach Notification</Title>
          <Paragraph>
            Growlio will notify the Controller without undue delay and within 72 hours where applicable, including
            details of the breach and mitigation steps.
          </Paragraph>

          <Title level={4}>8. International Transfers</Title>
          <Paragraph>
            Data may be processed outside the EEA with appropriate safeguards including standard contractual clauses.
          </Paragraph>

          <Title level={4}>9. Data Subject Rights</Title>
          <Paragraph>
            Growlio will assist the Controller in responding to access, correction, deletion, and portability requests.
          </Paragraph>

          <Title level={4}>10. Data Retention and Deletion</Title>
          <Paragraph>
            Upon termination, data will be deleted or returned upon request, except where retention is required by law.
          </Paragraph>

          <Title level={4}>11. Audits and Compliance</Title>
          <Paragraph>
            Growlio will provide reasonable information to demonstrate compliance upon request.
          </Paragraph>

          <Title level={4}>12. Governing Law</Title>
          <Paragraph>
            This Agreement is governed by the laws of the State of Michigan, United States.
          </Paragraph>

          <Title level={4}>13. Contact</Title>
          <Paragraph>
            support@growlio.ai
            <br />
            app.growlio.ai
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

