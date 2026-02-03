"use client";

interface SignupHeaderProps {
  plan: string | null;
}

export function SignupHeader({ plan }: SignupHeaderProps) {
  return (
    <>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Create your account
      </h1>
      {plan ? (
        <p className="text-center text-gray-600 mb-6">
          Sign up to get started with the{" "}
          <span className="font-medium capitalize">{plan}</span> plan
        </p>
      ) : (
        <p className="text-center text-gray-600 mb-6">
          Sign up to create dynamic QR codes
        </p>
      )}
    </>
  );
}
