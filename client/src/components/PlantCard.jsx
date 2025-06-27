import icon from "../images/Icon.png";
import MotorSection from "./MotorSection";
import SensorsActuatorsSection from "./SensorsActuatorsSection";

function PlantCard({ index }) {
  return (
    <div
      className="w-[380px] px-[10px] py-[13px] border border-[#DADADA] rounded-[12px] bg-[#FFFFFF] lg:w-[417px]"
    >
      <div className="flex justify-between mb-[20px] items-center">
        <p className="text-[#4E4D4D] text-[19px] font-[700]">
          Government Medical College Thrissur Medical College Thrissur
        </p>
        <button className="flex bg-[#66BB6A] items-center py-[10px] px-[18px] ml-[10px] rounded-[6px] gap-[10px] justify-center text-[16px] text-[#FFFFFF]">
          <img src={icon} alt="" className="w-[20px] h-[20px]" />
          START
        </button>
      </div>
      <div className="flex text-[14px] text-[#6B6B6B] mb-[10px] font-[400] justify-between">
        <div className="pr-[14px] lg:pr-[55.67px]">
          <p>Connection</p>
          <p className="text-[18px] text-[#EF5350] font-[600]">
            Disconnected
          </p>
        </div>
        <div className="pr-[82px] lg:pr-[123.67px]">
          <p>Status</p>
          <p className="text-[18px] text-[#208CD4] font-[600]">Idle</p>
        </div>
        <div>
          <p>Mode</p>
          <p className="text-[18px] text-[#4CAF50] font-[600]">Auto</p>
        </div>
      </div>
      <MotorSection />
      <SensorsActuatorsSection />
    </div>
  );
}

export default PlantCard;