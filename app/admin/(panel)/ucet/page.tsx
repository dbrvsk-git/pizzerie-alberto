import type { Metadata } from "next";
import { Card, PageTitle } from "@/app/admin/ui";
import PasswordForm from "./PasswordForm";

export const metadata: Metadata = { title: "Účet" };

export default function AccountPage() {
  return (
    <>
      <PageTitle>Účet</PageTitle>
      <Card title="Změna hesla">
        <PasswordForm />
      </Card>
    </>
  );
}
