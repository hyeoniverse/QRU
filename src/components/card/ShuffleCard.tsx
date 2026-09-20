import { Link } from "react-router-dom";
import { useQuery } from "react-query";

import { getCardPhoto } from "../../services/card";
import { CardDocument } from "../../types/cardType";
import CardPreview from "./CardPreview";

interface Props {
  card: CardDocument;
}

/**
 * 목록에 놓이는 명함 한 장.
 *
 * 사진은 명함 문서와 따로 저장되어 있어 한 번 더 읽어야 한다. 목록이
 * 뜨는 것을 막지 않도록 따로 가져오고, 한 번 읽은 것은 다시 읽지 않는다.
 */
function ShuffleCard({ card }: Props) {
  const { data: photo } = useQuery(
    ["card-photo", card.id],
    () => getCardPhoto(card),
    { enabled: card.hasPhoto, retry: false, staleTime: Infinity }
  );

  return (
    <li>
      {/* 크롤러가 남의 명함까지 따라 들어가지 않게 한다. */}
      <Link className="shuffle-card" rel="nofollow" to={`/cards/${card.id}`}>
        <CardPreview entries={card.entries} photo={photo} />
      </Link>
    </li>
  );
}

export default ShuffleCard;
