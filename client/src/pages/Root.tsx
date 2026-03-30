import { Outlet } from "react-router-dom";
import { Typography } from "antd";

const { Title } = Typography;

const Root = () => {
  return (
    <div className="flex flex-col h-screen md:flex-row">
      <div className="flex-1 flex justify-center items-center p-8">
        <Outlet />
      </div>
      <div className="flex-1 justify-center items-center bg-gradient-to-r from-blue-400 to-purple-500 p-8 hidden md:flex">
        <Title level={2} className="text-white text-center">
          Authguard
        </Title>
      </div>
    </div>
  );
};

export default Root;
