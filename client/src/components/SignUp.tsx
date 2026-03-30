import { SubmitHandler, useForm, Controller } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Divider, Form, Input, message, Typography } from "antd";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FcGoogle } from "react-icons/fc";
import { type signUpFields } from "../types/FormFields";
import { signUp, getApiErrorMessage } from "../api/client";

const { Paragraph } = Typography;

const signupSchema = z.object({
  firstname: z
    .string()
    .min(1, "First name is required")
    .regex(/^[a-zA-Z]+$/, "First name must contain only letters"),
  lastname: z
    .string()
    .min(1, "Last name is required")
    .regex(/^[a-zA-Z]+$/, "Last name must contain only letters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Must include uppercase, lowercase, number, and special character (@$!%*?&)"
    ),
});

const SignUp = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<signUpFields>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<signUpFields> = async (data) => {
    try {
      const res = await signUp({
        firstName: data.firstname,
        lastName: data.lastname,
        email: data.email,
        password: data.password,
      });
      if (res.status === 202) {
        const mfaData = res.data as { challenge: { id: string } };
        navigate("/mfa", { state: { challengeId: mfaData.challenge.id } });
      } else {
        messageApi.success("Account created successfully");
      }
    } catch (error) {
      messageApi.error(getApiErrorMessage(error));
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/accounts/auth/signin/sso/google";
  };

  return (
    <>
      {contextHolder}
      <Form
        onFinish={handleSubmit(onSubmit)}
        className="login-form border border-gray-300 p-8 rounded-lg shadow-lg max-w-md mx-auto bg-white"
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
      >
        <Form.Item>
          <Button icon={<FcGoogle />} block onClick={handleGoogleSignIn}>
            Continue with Google
          </Button>
        </Form.Item>
        <Divider plain>Or</Divider>
        <Form.Item
          label="First name"
          help={errors.firstname?.message}
          validateStatus={errors.firstname ? "error" : ""}
        >
          <Controller
            name="firstname"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item
          label="Last name"
          help={errors.lastname?.message}
          validateStatus={errors.lastname ? "error" : ""}
        >
          <Controller
            name="lastname"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item
          label="Email"
          help={errors.email?.message}
          validateStatus={errors.email ? "error" : ""}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item
          label="Password"
          help={errors.password?.message}
          validateStatus={errors.password ? "error" : ""}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => <Input.Password {...field} />}
          />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary" block loading={isSubmitting}>
            Sign up with email
          </Button>
        </Form.Item>
        <Form.Item>
          <Paragraph className="text-center">
            Already have an account? <Link to={"/"}>Login</Link>
          </Paragraph>
        </Form.Item>
      </Form>
    </>
  );
};

export default SignUp;
