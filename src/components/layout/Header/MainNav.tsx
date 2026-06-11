import MarkupBlock from "./MarkupBlock";
import AccountMenu from "./AccountMenu";
import CartMenu from "./CartMenu";
import WishlistMenu from "./WishlistMenu";
import { MAIN_NAV_LOGO_SEARCH_MARKUP } from "./generated/markup";

export default function MainNav() {
  return (
    <>
      <MarkupBlock html={MAIN_NAV_LOGO_SEARCH_MARKUP} />
      <AccountMenu />
      <WishlistMenu />
      <CartMenu />
    </>
  );
}
