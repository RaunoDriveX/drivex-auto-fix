import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "María Elena Rodríguez",
      location: "Ciudad de México",
      image: "👩‍💼",
      text: "DriveX me ayudó a ahorrar más de $3,000 pesos comparando precios. Antes iba al primer taller que encontraba, ahora sé que estoy pagando un precio justo.",
      benefit: "Saving Money",
      rating: 5
    },
    {
      name: "Carlos Hernández",
      location: "Guadalajara, Jalisco", 
      image: "👨‍🚗",
      text: "En 20 minutos ya tenía mi cita agendada y el técnico vino a mi oficina. No perdí tiempo buscando talleres ni esperando en filas. Increíble servicio.",
      benefit: "Saving Time",
      rating: 5
    },
    {
      name: "Ana Sofía Morales",
      location: "Monterrey, Nuevo León",
      image: "👩‍🎓", 
      text: "Por fin alguien que defiende mis intereses y no los del taller. DriveX me explicó todo claramente y me ayudó a tomar la mejor decisión para mi bolsillo.",
      benefit: "Peace of Mind",
      rating: 5
    }
  ];

  return (
    <section className="bg-gradient-to-br from-muted/30 to-background py-20">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Más de 300,000 conductores mexicanos ya confían en DriveX para reparar su cristal automotriz
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.name} className="relative overflow-hidden hover-scale animate-fade-in border-0 shadow-lg" style={{ animationDelay: `${index * 150}ms` }}>
              {/* Quote icon */}
              <div className="absolute top-4 right-4">
                <Quote className="h-8 w-8 text-primary/20" />
              </div>
              
              <CardContent className="p-6">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                {/* Testimonial text */}
                <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </blockquote>
                
                {/* Person info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>
                
                {/* Benefit badge */}
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {testimonial.benefit}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-6">
            Únete a miles de mexicanos que ya eligieron la forma inteligente de reparar su cristal
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/report/eo3w_x1IBgPaUDj8gsUVkI2qL8rG0gSx" 
              className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Comenzar evaluación
            </a>
            <a 
              href="mailto:fleet@drivex.com" 
              className="px-8 py-4 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors"
            >
              Contactar ventas flotillas
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;