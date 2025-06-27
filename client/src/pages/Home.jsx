import PlantCard from "../components/PlantCard";
import headImage from "../images/image 3 (1).png";
import dehaze from "../images/dehaze.png";

function Home() {
  return (
    <div className="max-w-[380px] mx-auto mb-[110px] lg:max-w-none lg:mx-0">
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mt-[40px] mb-[9px] lg:hidden">
          <img src={headImage} alt="" />
          <img src={dehaze} alt="" className="w-[24px] h-[24px]" />
        </div>
        <div className="right-side flex flex-col gap-6 items-start lg:flex-row lg:flex-wrap lg:gap-[12px] lg:px-[22px] lg:py-[110px]">
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <PlantCard key={index} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;