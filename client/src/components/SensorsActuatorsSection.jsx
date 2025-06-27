function SensorsActuatorsSection() {
  return (
    <div>
      <p className="border-b border-b-[#208CD4] pb-[6px] text-[#4E4D4D] font-[700] text-[18px]">
        Sensors & Actuators
      </p>
      <div className="mt-[6px] text-[#6B6B6B] text-[14px] font-[400]">
        <div className="flex border-b border-b-[#DADADA] pb-[6px] gap-9 lg:gap-15">
          <div className="w-[33%]">
            <p className="">Water Inflow</p>
            <p className="text-[16px] font-[700] text-[#EF5350]">OFF</p>
          </div>
          <div className="w-[33%]">
            <p className="">HOCL/Drainage</p>
            <p className="text-[16px] font-[700] text-[#EF5350]">OFF</p>
          </div>
          <div className="w-[33%]">
            <p className="">Chlorine Gas</p>
            <p className="text-[16px] font-[700] text-[#EF5350]">OFF</p>
          </div>
        </div>
        <div className="flex border-b border-b-[#DADADA] py-[6px] gap-9 lg:gap-15">
          <div className="w-[33%]">
            <p className="">Actuator 4</p>
            <p className="text-[16px] font-[700] text-[#EF5350]">OFF</p>
          </div>
          <div className="w-[33%]">
            <p className="">Water Level</p>
            <p className="text-[16px] font-[600] text-[#208CD4]">---%</p>
          </div>
          <div className="w-[33%]">
            <p className="">OHT Level</p>
            <p className="text-[16px] font-[600] text-[#208CD4]">---%</p>
          </div>
        </div>
        <div className="flex border-b border-b-[#DADADA] py-[6px] gap-9 lg:gap-15">
          <div className="w-[33%]">
            <p className="">Vacuum Switch</p>
            <p className="text-[16px] font-[600] text-[#66BB6A]">OK</p>
          </div>
          <div className="w-[33%]">
            <p className="">Cylinder wt</p>
            <p className="text-[16px] font-[600] text-[#208CD4]">---kg</p>
          </div>
          <div className="w-[33%]">
            <p className="">Res.cl (plant)</p>
            <p className="text-[16px] font-[600] text-[#208CD4]">---ppm</p>
          </div>
        </div>
        <div className="flex border-b border-b-[#DADADA] py-[6px] gap-9 lg:gap-15">
          <div className="w-[33%]">
            <p className="">Res.cl (farthest)</p>
            <p className="text-[16px] font-[600] text-[#208CD4]">---ppm</p>
          </div>
          <div className="w-[33%]">
            <p className="">Leakage</p>
            <p className="text-[16px] font-[600] text-[#EF5350]">No</p>
          </div>
          <div className="w-[33%]">
            <p className="">Last Fault</p>
            <p className="text-[16px] font-[600] text-[#208CD4]">None</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SensorsActuatorsSection;