"use client";

import { PageHeader } from "@/components/ui/misc";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/store/auth";

export default function SettingsPage() {
  const claims = useAuth((s) => s.claims);
  return (
    <div>
      <PageHeader
        title="Institution settings"
        subtitle="Branding and platform-wide defaults."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Institution</CardTitle>
            <CardDescription>Profile shown to candidates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="Institution ID">
              <Input value={claims?.institutionId ?? ""} readOnly />
            </Field>
            <Field label="Display name">
              <Input placeholder="Your institution name" />
            </Field>
            <Button>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default proctoring weights</CardTitle>
            <CardDescription>
              Applied to new exams unless overridden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="Tab switch weight">
              <Input type="number" step="0.05" defaultValue={0.15} />
            </Field>
            <Field label="Face missing weight">
              <Input type="number" step="0.05" defaultValue={0.25} />
            </Field>
            <Button variant="outline">Save defaults</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
