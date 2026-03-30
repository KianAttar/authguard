import { useEffect, useState } from "react";
import { SubmitHandler, useForm, Controller } from "react-hook-form";
import { Button, Form, Input, message, Typography } from "antd";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const { Paragraph } = Typography;

const mfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code must be a 6-digit number"),
});

type MFAField = {
  code: string;
};

const MFA = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [timer, setTimer] = useState(60);
  const [isResendAvailable, setIsResendAvailable] = useState(false);

  const errorMessage = (msg: string) => {
    messageApi.error(msg);
  };

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MFAField>({
    resolver: zodResolver(mfaSchema),
  });

  const onSubmit: SubmitHandler<MFAField> = async (data) => {
    try {
      //request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setError("root", {
        type: "manual",
        message: "Verification failed. Please try again.",
      });
      errorMessage("Verification failed. Please try again.");
      console.log(data);
    } catch (error) {
      message.error("An unexpected error occurred");
    }
  };

  const handleResend = () => {
    setTimer(60);
    setIsResendAvailable(false);
    // request
  };

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    } else {
      setIsResendAvailable(true);
    }
  }, [timer]);

  return (
    <>
      {contextHolder}
      <Form
        onFinish={handleSubmit(onSubmit)}
        className="mfa-form border border-gray-300 p-8 rounded-lg shadow-lg max-w-md mx-auto bg-white"
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
      >
        <Form.Item
          label="Enter the 6-digit verification code we have sent you"
          help={errors.code?.message}
          validateStatus={errors.code ? "error" : ""}
          wrapperCol={{ span: 24 }}
          style={{
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          <Controller
            name="code"
            control={control}
            render={({ field }) => <Input.OTP {...field} />}
          />
        </Form.Item>

        <Form.Item>
          <Paragraph
            className="text-center"
            style={{ pointerEvents: isResendAvailable ? "auto" : "none" }}
            onClick={isResendAvailable ? handleResend : undefined}
          >
            <a>Resend</a> {isResendAvailable ? "" : ` (available in ${timer}s)`}
          </Paragraph>
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary" block loading={isSubmitting}>
            Continue
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default MFA;
