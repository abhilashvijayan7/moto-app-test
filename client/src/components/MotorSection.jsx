function MotorSection() {
  return (
    <div className="mb-[6px]">
      <p className="text-[18px] text-[#4E4D4D] pb-[6px] border-b border-b-[#208CD4] mb-[12px] font-[700]">
        Motor & Power
      </p>
      <div className="lg:flex gap-3">
        <div className="border border-[#DADADA] rounded-[8px] py-[12px] px-[8px] mb-[10px] text-[14px] font-[400] text-[#6B6B6B] lg:w-[485px]">
          <div className="flex items-center justify-between border-b border-b-[#DADADA] pb-[12px] font-[700] text-[#4E4D4D]">
            <p className="text-[18px]">Motor 1</p>
            <p className="text-[16px] text-[#EF5350]">OFF</p>
          </div>
          <div className="flex py-[12px] justify-between text-[14px]">
            <p>V (L1/L2/L3)</p>
            <p className="text-[#208CD4] font-[600]">225/226/227 V</p>
          </div>
          <div className="flex pt-[2px] pb-[14px] justify-between">
            <p>I (L1/L2/L3)</p>
            <p className="text-[#208CD4] font-[600]">8/8.8/9 I</p>
          </div>
          <div className="flex justify-between">
            <p>Timers (Sess/Cum)</p>
            <p className="text-[#208CD4] font-[600]">1h/ 10m/ 25s</p>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <div className="flex items-center justify-between border border-[#DADADA] rounded-md px-2 py-1.5 font-[700] text-[#4E4D4D] ">
          <p className="text-[18px] mr-2">Motor 2</p>
          <p className="text-[16px] text-[#66BB6A]">STAND BY</p>
        </div>
        <div className="flex items-center justify-between border border-[#DADADA] rounded-md px-2 py-1.5 font-[700] text-[#4E4D4D]">
          <p className="text-[18px] mr-2">Motor 3</p>
          <p className="text-[16px] text-[#EF5350]">OFF</p>
        </div>
      </div>
    </div>
  );
}

export default MotorSection;