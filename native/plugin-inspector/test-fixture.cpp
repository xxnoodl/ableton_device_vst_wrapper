// Original ABI test module. It exposes a controller, not an audio processor or production plugin.
#define INIT_CLASS_IID
#include "pluginterfaces/base/ipluginbase.h"
#include "pluginterfaces/vst/ivstcomponent.h"
#include "pluginterfaces/vst/ivsteditcontroller.h"
#include <windows.h>
#include <atomic>
#include <cstring>
using namespace Steinberg;
using namespace Steinberg::Vst;
namespace {
const TUID componentId=INLINE_UID(0x12345678,0x12345678,0x12345678,0x12345678);
const TUID componentId2=INLINE_UID(0x12345679,0x12345678,0x12345678,0x12345678);
bool same(const TUID a,const TUID b){return std::memcmp(a,b,16)==0;}
void text(const char16_t* source,char16* dest){size_t i=0;while(source[i]&&i<127){dest[i]=source[i];++i;}dest[i]=0;}
struct Component final:IComponent,IEditController{
 std::atomic<uint32> refs{1};
 tresult PLUGIN_API queryInterface(const TUID id,void** out) override{*out=nullptr;if(same(id,IComponent_iid)||same(id,FUnknown_iid))*out=static_cast<IComponent*>(this);else if(same(id,IEditController_iid))*out=static_cast<IEditController*>(this);else return kNoInterface;addRef();return kResultOk;}
 uint32 PLUGIN_API addRef() override{return ++refs;}uint32 PLUGIN_API release() override{auto n=--refs;if(!n)delete this;return n;}
 tresult PLUGIN_API initialize(FUnknown*) override{return kResultOk;}tresult PLUGIN_API terminate() override{return kResultOk;}
 tresult PLUGIN_API getControllerClassId(TUID) override{return kNotImplemented;}tresult PLUGIN_API setIoMode(IoMode) override{return kResultOk;}
 int32 PLUGIN_API getBusCount(MediaType,BusDirection) override{return 0;}tresult PLUGIN_API getBusInfo(MediaType,BusDirection,int32,BusInfo&) override{return kNotImplemented;}
 tresult PLUGIN_API getRoutingInfo(RoutingInfo&,RoutingInfo&) override{return kNotImplemented;}tresult PLUGIN_API activateBus(MediaType,BusDirection,int32,TBool) override{return kResultOk;}tresult PLUGIN_API setActive(TBool) override{return kResultOk;}
 tresult PLUGIN_API setState(IBStream*) override{return kResultOk;}tresult PLUGIN_API getState(IBStream*) override{return kResultOk;}tresult PLUGIN_API setComponentState(IBStream*) override{return kResultOk;}
 int32 PLUGIN_API getParameterCount() override{return 3;}
 tresult PLUGIN_API getParameterInfo(int32 i,ParameterInfo& p) override{if(i<0||i>2)return kInvalidArgument;p={};p.id=100+i;p.flags=ParameterInfo::kCanAutomate;p.defaultNormalizedValue=i==0?.25:i==1?.5:-1;p.stepCount=i==1?3:0;text(i==0?u"Level":i==1?u"Mode":u"Invalid default",p.title);text(i==0?u"dB":u"",p.units);return kResultOk;}
 tresult PLUGIN_API getParamStringByValue(ParamID id,ParamValue value,String128 out) override{if(id==101){const char16_t* names[]={u"Clean",u"Warm",u"Bright",u"Dark"};int n=int(value*3+.5);if(n<0||n>3)return kInvalidArgument;text(names[n],out);}else text(u"-12 dB",out);return kResultOk;}
 tresult PLUGIN_API getParamValueByString(ParamID,TChar*,ParamValue&) override{return kNotImplemented;}
 ParamValue PLUGIN_API normalizedParamToPlain(ParamID id,ParamValue value) override{return id==100?-24+48*value:value*3;}
 ParamValue PLUGIN_API plainParamToNormalized(ParamID id,ParamValue value) override{return id==100?(value+24)/48:value/3;}
 ParamValue PLUGIN_API getParamNormalized(ParamID) override{return .25;}tresult PLUGIN_API setParamNormalized(ParamID,ParamValue) override{return kResultOk;}
 tresult PLUGIN_API setComponentHandler(IComponentHandler*) override{return kResultOk;}IPlugView* PLUGIN_API createView(FIDString) override{return nullptr;}
};
struct Factory final:IPluginFactory{
 std::atomic<uint32> refs{1};
 tresult PLUGIN_API queryInterface(const TUID id,void** out) override{*out=nullptr;if(same(id,IPluginFactory_iid)||same(id,FUnknown_iid)){*out=static_cast<IPluginFactory*>(this);addRef();return kResultOk;}return kNoInterface;}
 uint32 PLUGIN_API addRef() override{return ++refs;}uint32 PLUGIN_API release() override{return --refs;}
 tresult PLUGIN_API getFactoryInfo(PFactoryInfo* p) override{*p={};std::strcpy(p->vendor,"Studio test fixture");return kResultOk;}
 int32 PLUGIN_API countClasses() override{
 #if defined(FIXTURE_multi)
 return 2;
 #else
 return 1;
 #endif
 }
 tresult PLUGIN_API getClassInfo(int32 i,PClassInfo* p) override{if(i<0||i>=countClasses())return kInvalidArgument;*p={};std::memcpy(p->cid,i?componentId2:componentId,16);p->cardinality=PClassInfo::kManyInstances;std::strcpy(p->name,i?"Second test component":"Inspector ABI fixture");std::strcpy(p->category,"Audio Module Class");return kResultOk;}
 tresult PLUGIN_API createInstance(FIDString cid,FIDString iid,void** out) override{*out=nullptr;if(!same(cid,componentId)&&!same(cid,componentId2))return kInvalidArgument;auto c=new Component;auto r=c->queryInterface(iid,out);c->release();return r;}
};
Factory factory;
}
extern "C" __declspec(dllexport) bool PLUGIN_API InitDll(){
 #if defined(FIXTURE_crash)
 RaiseException(EXCEPTION_ACCESS_VIOLATION,EXCEPTION_NONCONTINUABLE,0,nullptr);
 #elif defined(FIXTURE_hang)
 Sleep(INFINITE);
 #endif
 return true;
}
extern "C" __declspec(dllexport) bool PLUGIN_API ExitDll(){return true;}
extern "C" __declspec(dllexport) IPluginFactory* PLUGIN_API GetPluginFactory(){factory.addRef();return &factory;}
