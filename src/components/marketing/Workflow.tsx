import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Camera, Brain, Target, Calendar, MapPin, Clock, Star } from "lucide-react";

const Workflow = () => {
  const { t } = useTranslation('marketing');

  const steps = [
    { 
      icon: Smartphone, 
      title: t('workflow.steps.vehicle_info.title'), 
      desc: t('workflow.steps.vehicle_info.desc'),
      color: "bg-blue-500/10 text-blue-600"
    },
    { 
      icon: Camera, 
      title: t('workflow.steps.inspection.title'), 
      desc: t('workflow.steps.inspection.desc'),
      color: "bg-green-500/10 text-green-600"
    },
    { 
      icon: Brain, 
      title: t('workflow.steps.ai_triage.title'), 
      desc: t('workflow.steps.ai_triage.desc'),
      color: "bg-purple-500/10 text-purple-600"
    },
    { 
      icon: Target, 
      title: t('workflow.steps.matching.title'), 
      desc: t('workflow.steps.matching.desc'),
      color: "bg-orange-500/10 text-orange-600"
    },
    { 
      icon: Calendar, 
      title: t('workflow.steps.book.title'), 
      desc: t('workflow.steps.book.desc'),
      color: "bg-indigo-500/10 text-indigo-600"
    },
  ];

  return (
    <section id="workflow" aria-labelledby="workflow-heading" className="bg-gradient-to-br from-background to-muted/20 py-16">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 id="workflow-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('workflow.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('workflow.description')}
          </p>
        </div>

        {/* Process steps - 3 on top, 2 centered on bottom */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.slice(0, 3).map(({ icon: Icon, title, desc, color }, i) => (
            <Card
              key={title}
              className="relative hover-scale animate-fade-in border-0 shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Step number indicator */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center z-10">
                <span className="text-sm font-bold text-primary">{i + 1}</span>
              </div>
              
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardHeader className="relative pr-14">
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="text-lg font-semibold">{title}</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative">
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
                
                {/* Additional detail icons */}
                <div className="flex gap-2 mt-4 opacity-60">
                  {i === 1 && <Camera className="h-4 w-4" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Bottom row - 2 items centered */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          <div className="hidden lg:block" /> {/* Spacer for centering on large screens */}
          {steps.slice(3, 5).map(({ icon: Icon, title, desc, color }, i) => (
            <Card
              key={title}
              className="relative hover-scale animate-fade-in border-0 shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden group hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${(i + 3) * 100}ms` }}
            >
              {/* Step number indicator */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center z-10">
                <span className="text-sm font-bold text-primary">{i + 4}</span>
              </div>
              
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardHeader className="relative pr-14">
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="text-lg font-semibold">{title}</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative">
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
                
                {/* Additional detail icons */}
                <div className="flex gap-2 mt-4 opacity-60">
                  {i === 0 && (
                    <>
                      <MapPin className="h-4 w-4" />
                      <Star className="h-4 w-4" />
                    </>
                  )}
                  {i === 1 && <Clock className="h-4 w-4" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Workflow;
