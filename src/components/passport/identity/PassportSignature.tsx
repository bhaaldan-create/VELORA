import { PassportVeloraSignatureMark } from "./PassportVeloraSignatureMark";

type Props = { ar?: boolean };

export function PassportSignature({ ar = false }: Props) {
  return (
    <div className="vp-signature">
      <PassportVeloraSignatureMark className="vp-signature__mark" />
      <p className="vp-signature__caption">
        {ar ? "صادر رسميًا عن VELORA" : "Officially issued by VELORA"}
      </p>
    </div>
  );
}
