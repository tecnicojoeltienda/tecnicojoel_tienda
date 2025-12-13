
import HeaderTienda from "../../layouts/tienda/HeaderTienda";

import CarruselPrincipal from "../../components/tienda/CarruselPrincipal";
import Novedades from "../../components/tienda/Novedades";
//import CategoriasGrid from "../../components/tienda/CategoriasGrid";
import FooterTienda from "../../layouts/tienda/FooterTienda";
import CategoriasCarrusel from "../../components/tienda/CategoriasCarrusel";
import PromoDoble from "../../components/tienda/PromoDoble";
import PromoMosaic from "../../components/tienda/PromoMosaic";
import ServiciosTienda from "../../components/tienda/ServiciosTienda";
import DobleCarrusel from "../../components/tienda/DobleCarrusel";
import CarruselPromocion from "../../components/tienda/CarruselPromocion";
function PrincipalTienda() {
  return (
    <div className="min-h-screen">
      <HeaderTienda />
      {/* <main className="px-6 sm:px-8 lg:px-8 xl:px-16"> */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-16">
        <CarruselPrincipal />
        
          <CategoriasCarrusel />
          <CarruselPromocion />
          <PromoDoble />
          <Novedades />
          <PromoMosaic />
          <DobleCarrusel />
          <ServiciosTienda />
          
      </main>
      <FooterTienda />
    </div>
  );
}

export default PrincipalTienda;
