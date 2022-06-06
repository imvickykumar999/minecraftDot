import { useEffect, useRef, useState } from "react";
import geenrateImageFromBlueprint from "src/components/Pages/Home/functions/generateImageFromBlueprint";
import { useBlockDBContext } from "src/store/useBlockDB";
import Modal from "react-modal";
import { useBlueprintContext } from "src/store/useBlueprint";
import getContext from "src/functions/getContext";
import getBufferCanvas from "src/functions/getBufferCanvas";
import CrossButton from "src/components/Common/CrossButton.tsx";
import { calcRBCoordinate, validInput } from "src/components/Pages/Editor/functions/cornerCoordinate";
import generateCommand from "src/components/Pages/Editor/functions/generateCommand";
import generatePackZip from "../../Pages/Editor/functions/generatePackZip";
import { saveAs } from "file-saver";
import EditionButton from "./EditionButton";
import CoordinateInput from "./CoordinateInput";
import { useLocale } from "src/i18n/useLocale";

interface Props {
  blueprint: string[][];
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
}

interface CornerCoordinate {
  ltx: number;
  lty: number;
  ltz: number;
  rtx: number;
  rty: number;
  rtz: number;
  lbx: number;
  lby: number;
  lbz: number;
}
const modalStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    padding: "7px",
    marginRight: "-50%",
    backgroundColor: "#2d2d2d",
    borderRadius: "8px",
    transform: "translate(-50%, -50%)",
  },
};

const CommandModal = ({ blueprint, isModalOpen, setIsModalOpen }: Props) => {
  const { t } = useLocale();
  const [isCommandReady, setIsCommandReady] = useState(false);
  const [editon, setEdition] = useState<Edition>("java");
  const [RBCoordinate, setRBCoordinate] = useState<Coordinate3D>({ x: 0, y: 0, z: 0 });
  const [cornerCoordinates, setCornerCoordinates] = useState<CornerCoordinate>({
    ltx: 0,
    lty: 0,
    ltz: 0,
    rtx: 0,
    rty: 0,
    rtz: 0,
    lbx: 0,
    lby: 0,
    lbz: 0,
  });
  // const [coodinateIsOk, setCoordinateIsOk] = useState(false);
  const { setInitBlueprint } = useBlueprintContext();
  const { blockImageDataDict, javaId2index, blockDB } = useBlockDBContext();
  const mainCanvas = useRef(null);
  const mainCanvasWidth = 1000;
  const mainCanvasHeight = 1000;

  const tryComplement = (coordinate: CornerCoordinate, expectedWidth: number, expectedHeight: number) => {
    setIsCommandReady(false);
    const c1: Coordinate3D = { x: coordinate.ltx, y: coordinate.lty, z: coordinate.ltz };
    const c2: Coordinate3D = { x: coordinate.rtx, y: coordinate.rty, z: coordinate.rtz };
    const c3: Coordinate3D = { x: coordinate.lbx, y: coordinate.lby, z: coordinate.lbz };

    if (validInput(c1, c2, c3, expectedWidth, expectedHeight)) {
      /* if coordinate is valid, show RB coordinate */
      setRBCoordinate(calcRBCoordinate(c1, c2, c3));
      setIsCommandReady(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChangeCoordinate = (key: string, value: number) => {
    console.log(key, value);
    setCornerCoordinates({ ...cornerCoordinates, [key]: value });
  };

  useEffect(() => {
    if (blueprint === undefined || blueprint.length === 0) return;
    tryComplement(cornerCoordinates, blueprint[0].length, blueprint.length);
  }, [cornerCoordinates]);

  const afterOpenModal = () => {
    const minecraftImage = geenrateImageFromBlueprint(blueprint, blockImageDataDict);

    /* set minecraftImage to buffer canvs */
    const bufferCanvas = getBufferCanvas(minecraftImage, minecraftImage.width, minecraftImage.height);

    /* output image */
    const mainCanvasContext = getContext(mainCanvas.current, mainCanvasWidth, mainCanvasHeight);
    mainCanvasContext.drawImage(bufferCanvas, 0, 0, mainCanvasWidth, mainCanvasHeight);
    setInitBlueprint(blueprint);
  };

  const handleGenerateCommand = () => {
    const LT = { x: cornerCoordinates.ltx, y: cornerCoordinates.lty, z: cornerCoordinates.ltz };
    const RT = { x: cornerCoordinates.rtx, y: cornerCoordinates.rty, z: cornerCoordinates.rtz };
    const LB = { x: cornerCoordinates.lbx, y: cornerCoordinates.lby, z: cornerCoordinates.lbz };

    const packZip = generatePackZip(
      generateCommand(blueprint, javaId2index, blockDB, editon, LT, RT, LB),
      editon
    );

    // zip download
    packZip.generateAsync({ type: "blob" }).then(
      function (blob: Blob) {
        saveAs(blob, "minecraftDot.zip");
      },
      function (err: any) {
        console.log("zip download error", err);
      }
    );
  };

  if (blueprint === undefined || blueprint.length === 0) return <></>;
  return (
    <>
      <Modal isOpen={isModalOpen} ariaHideApp={false} onAfterOpen={afterOpenModal} style={modalStyles}>
        <div className="flex justify-end">
          <button onClick={closeModal}>
            <CrossButton />
          </button>
        </div>

        <div className="flex justify-center">
          <div className="w-fit border-2 border-neutral-600 rounded-md flex justify-center">
            <div className="">
              <EditionButton id="javaButton" selected={editon === "java"} onChange={() => setEdition("java")}>
                {t.JAVA_EDITION}
              </EditionButton>
            </div>
            <div className="">
              <EditionButton
                id="bedrockButton"
                selected={editon === "bedrock"}
                onChange={() => setEdition("bedrock")}
              >
                {t.BEDROCK_EDITION}
              </EditionButton>
            </div>
          </div>
        </div>

        <div className="flex justify-center">{blueprint.length}</div>

        <div className="flex justify-between">
          <div className="flex flex-col justify-between items-center">
            <div className="flex flex-col">
              <CoordinateInput
                onChange={(e) => handleChangeCoordinate("ltx", Number(e.target.value))}
              ></CoordinateInput>
              <CoordinateInput
                onChange={(e) => handleChangeCoordinate("lty", Number(e.target.value))}
              ></CoordinateInput>
              <CoordinateInput
                onChange={(e) => handleChangeCoordinate("ltz", Number(e.target.value))}
              ></CoordinateInput>
            </div>
            <div>{blueprint[0].length}</div>
            <div className="flex flex-col">
              <CoordinateInput
                onChange={(e) => handleChangeCoordinate("lbx", Number(e.target.value))}
              ></CoordinateInput>
              <CoordinateInput
                onChange={(e) => handleChangeCoordinate("lby", Number(e.target.value))}
              ></CoordinateInput>
              <CoordinateInput
                onChange={(e) => handleChangeCoordinate("lbz", Number(e.target.value))}
              ></CoordinateInput>
            </div>
          </div>

          <div className="w-[35vw] flex justify-center">
            <canvas
              id="canvas-out"
              ref={mainCanvas}
              className="w-[100%] border-2 border-neutral-600"
            ></canvas>
          </div>

          <div className="flex flex-col justify-between">
            <div className="flex flex-col">
              <CoordinateInput
                onChange={(e) => handleChangeCoordinate("rtx", Number(e.target.value))}
              ></CoordinateInput>
              <CoordinateInput
                onChange={(e) => handleChangeCoordinate("rty", Number(e.target.value))}
              ></CoordinateInput>
              <CoordinateInput
                onChange={(e) => handleChangeCoordinate("rtz", Number(e.target.value))}
              ></CoordinateInput>
            </div>
            {/* these input is read only */}
            <div className="flex flex-col">
              <input
                type="number"
                value={RBCoordinate?.x}
                readOnly={true}
                className="border-2 border-neutral-600 bg-neutral-500 rounded w-14"
              />
              <input
                type="number"
                value={RBCoordinate?.y}
                readOnly={true}
                className="border-2 border-neutral-600 bg-neutral-500 rounded w-14"
              />
              <input
                type="number"
                value={RBCoordinate?.z}
                readOnly={true}
                className="border-2 border-neutral-600 bg-neutral-500 rounded w-14"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-2">
          <button
            onClick={handleGenerateCommand}
            className="p-1 rounded-md disabled:bg-neutral-900 disabled:text-neutral-600 bg-m-green-light text-white"
            disabled={!isCommandReady}
          >
            {t.COMMAND_GENERATION}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default CommandModal;