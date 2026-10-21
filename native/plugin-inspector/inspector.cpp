// Metadata inspection only. The original plugin executes inside this disposable process.
#define INIT_CLASS_IID
#include "pluginterfaces/base/ipluginbase.h"
#include "pluginterfaces/base/ibstream.h"
#include "pluginterfaces/vst/ivstcomponent.h"
#include "pluginterfaces/vst/ivsteditcontroller.h"
#include "pluginterfaces/vst/ivsthostapplication.h"
#include <windows.h>
#include <objbase.h>
#include <io.h>
#include <atomic>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <iomanip>
#include <map>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#include <algorithm>

using namespace Steinberg;
using namespace Steinberg::Vst;
namespace {
bool same(const TUID a,const TUID b){return std::memcmp(a,b,16)==0;}
std::string utf8(const wchar_t* s,int length){
 if(!length)return {};
 int n=WideCharToMultiByte(CP_UTF8,0,s,length,nullptr,0,nullptr,nullptr);
 std::string result(n,'\0');WideCharToMultiByte(CP_UTF8,0,s,length,result.data(),n,nullptr,nullptr);return result;
}
std::string string16(const char16* s,size_t limit=128){size_t n=0;while(n<limit&&s[n])++n;return utf8(reinterpret_cast<const wchar_t*>(s),static_cast<int>(n));}
std::string string8(const char* s,size_t limit){size_t n=0;while(n<limit&&s[n])++n;return std::string(s,n);}
std::string quote(const std::string& s){
 std::ostringstream out;out<<'"';for(unsigned char c:s){switch(c){case '"':out<<"\\\"";break;case '\\':out<<"\\\\";break;case '\n':out<<"\\n";break;case '\r':out<<"\\r";break;case '\t':out<<"\\t";break;default:if(c<32)out<<"\\u00"<<std::hex<<std::setw(2)<<std::setfill('0')<<int(c)<<std::dec;else out<<c;}}out<<'"';return out.str();
}
std::string numeric(double n){if(!std::isfinite(n))return "null";std::ostringstream out;out<<std::setprecision(17)<<n;return out.str();}
std::string uid(const TUID id){char text[33]={};FUID::fromTUID(id).toString(text);return text;}
template<class T> T* query(FUnknown* source){T* result=nullptr;if(source)source->queryInterface(T::iid,reinterpret_cast<void**>(&result));return result;}
void require(bool ok,const char* message){if(!ok)throw std::runtime_error(message);}
struct Attributes final: IAttributeList {
 std::atomic<uint32> refs{1};std::map<std::string,int64> ints;std::map<std::string,double> floats;std::map<std::string,std::u16string> strings;std::map<std::string,std::vector<uint8>> binaries;
 tresult PLUGIN_API queryInterface(const TUID id,void** out) override{*out=nullptr;if(same(id,IAttributeList_iid)||same(id,FUnknown_iid)){*out=static_cast<IAttributeList*>(this);addRef();return kResultOk;}return kNoInterface;}
 uint32 PLUGIN_API addRef() override{return ++refs;}uint32 PLUGIN_API release() override{auto n=--refs;if(!n)delete this;return n;}
 tresult PLUGIN_API setInt(AttrID k,int64 v) override{ints[k]=v;return kResultOk;}tresult PLUGIN_API getInt(AttrID k,int64& v) override{auto i=ints.find(k);if(i==ints.end())return kResultFalse;v=i->second;return kResultOk;}
 tresult PLUGIN_API setFloat(AttrID k,double v) override{floats[k]=v;return kResultOk;}tresult PLUGIN_API getFloat(AttrID k,double& v) override{auto i=floats.find(k);if(i==floats.end())return kResultFalse;v=i->second;return kResultOk;}
 tresult PLUGIN_API setString(AttrID k,const char16* v) override{size_t n=0;while(n<65536&&v[n])++n;if(n==65536)return kInvalidArgument;strings[k]=std::u16string(reinterpret_cast<const char16_t*>(v),n);return kResultOk;}
 tresult PLUGIN_API getString(AttrID k,char16* v,uint32 bytes) override{auto i=strings.find(k);if(i==strings.end()||bytes<2)return kResultFalse;size_t n=std::min(i->second.size(),size_t(bytes/2-1));std::memcpy(v,i->second.data(),n*2);v[n]=0;return kResultOk;}
 tresult PLUGIN_API setBinary(AttrID k,const void* data,uint32 bytes) override{if(bytes>16*1024*1024)return kInvalidArgument;auto p=static_cast<const uint8*>(data);binaries[k]=std::vector<uint8>(p,p+bytes);return kResultOk;}
 tresult PLUGIN_API getBinary(AttrID k,const void*& data,uint32& bytes) override{auto i=binaries.find(k);if(i==binaries.end())return kResultFalse;data=i->second.data();bytes=static_cast<uint32>(i->second.size());return kResultOk;}
};
struct Message final: IMessage {
 std::atomic<uint32> refs{1};std::string id;Attributes* attributes=new Attributes;
 ~Message(){attributes->release();}
 tresult PLUGIN_API queryInterface(const TUID requested,void** out) override{*out=nullptr;if(same(requested,IMessage_iid)||same(requested,FUnknown_iid)){*out=static_cast<IMessage*>(this);addRef();return kResultOk;}return kNoInterface;}
 uint32 PLUGIN_API addRef() override{return ++refs;}uint32 PLUGIN_API release() override{auto n=--refs;if(!n)delete this;return n;}
 FIDString PLUGIN_API getMessageID() override{return id.c_str();}void PLUGIN_API setMessageID(FIDString value) override{id=value?value:"";}IAttributeList* PLUGIN_API getAttributes() override{return attributes;}
};
struct Host final: IHostApplication,IComponentHandler {
 std::atomic<uint32> refs{1};
 tresult PLUGIN_API queryInterface(const TUID id,void** out) override{
  *out=nullptr;if(same(id,IHostApplication_iid)||same(id,FUnknown_iid))*out=static_cast<IHostApplication*>(this);else if(same(id,IComponentHandler_iid))*out=static_cast<IComponentHandler*>(this);else return kNoInterface;addRef();return kResultOk;
 }
 uint32 PLUGIN_API addRef() override{return ++refs;}uint32 PLUGIN_API release() override{return --refs;}
 tresult PLUGIN_API getName(String128 name) override{const char16_t* s=u"Interface Studio Inspector";size_t i=0;while(s[i]&&i<127){name[i]=s[i];++i;}name[i]=0;return kResultOk;}
 tresult PLUGIN_API createInstance(TUID cid,TUID requested,void** out) override{
  *out=nullptr;FUnknown* object=nullptr;
  if(same(cid,IMessage_iid))object=new Message;else if(same(cid,IAttributeList_iid))object=new Attributes;else return kNoInterface;
  auto result=object->queryInterface(requested,out);object->release();return result;
 }
 tresult PLUGIN_API beginEdit(ParamID) override{return kResultOk;}tresult PLUGIN_API performEdit(ParamID,ParamValue) override{return kResultOk;}
 tresult PLUGIN_API endEdit(ParamID) override{return kResultOk;}tresult PLUGIN_API restartComponent(int32) override{return kResultOk;}
};
struct Stream final: IBStream {
 std::atomic<uint32> refs{1};std::vector<uint8> data;int64 position=0;
 tresult PLUGIN_API queryInterface(const TUID id,void** out) override{*out=nullptr;if(same(id,IBStream_iid)||same(id,FUnknown_iid)){*out=static_cast<IBStream*>(this);addRef();return kResultOk;}return kNoInterface;}
 uint32 PLUGIN_API addRef() override{return ++refs;}uint32 PLUGIN_API release() override{return --refs;}
 tresult PLUGIN_API read(void* buffer,int32 count,int32* done) override{if(done)*done=0;if(count<0)return kInvalidArgument;size_t n=std::min(size_t(count),data.size()-size_t(position));if(n)std::memcpy(buffer,data.data()+position,n);position+=n;if(done)*done=static_cast<int32>(n);return n==size_t(count)?kResultOk:kResultFalse;}
 tresult PLUGIN_API write(void* buffer,int32 count,int32* done) override{if(done)*done=0;if(count<0||position+count>16*1024*1024)return kInvalidArgument;if(position+count>static_cast<int64>(data.size()))data.resize(size_t(position+count));if(count)std::memcpy(data.data()+position,buffer,count);position+=count;if(done)*done=count;return kResultOk;}
 tresult PLUGIN_API seek(int64 offset,int32 mode,int64* result) override{int64 next=(mode==kIBSeekSet?0:mode==kIBSeekCur?position:mode==kIBSeekEnd?static_cast<int64>(data.size()):-1)+offset;if(mode<0||mode>2||next<0||next>static_cast<int64>(data.size()))return kInvalidArgument;position=next;if(result)*result=position;return kResultOk;}
 tresult PLUGIN_API tell(int64* result) override{if(!result)return kInvalidArgument;*result=position;return kResultOk;}
};
struct Plugin {
 HMODULE module=nullptr;IPluginFactory* factory=nullptr;IComponent* component=nullptr;IEditController* controller=nullptr;IConnectionPoint* pc=nullptr;IConnectionPoint* cc=nullptr;
 bool componentReady=false,controllerReady=false,ownController=false,entered=false;
 ~Plugin(){
  if(pc&&cc){pc->disconnect(cc);cc->disconnect(pc);}if(pc)pc->release();if(cc)cc->release();
  if(controller){controller->setComponentHandler(nullptr);if(controllerReady&&ownController)controller->terminate();controller->release();}
  if(component){if(componentReady)component->terminate();component->release();}if(factory)factory->release();
  if(module){if(entered){auto exit=reinterpret_cast<bool(PLUGIN_API*)()>(GetProcAddress(module,"ExitDll"));if(exit)exit();}FreeLibrary(module);}
 }
};
void limits(){
 HANDLE job=CreateJobObjectW(nullptr,nullptr);require(job!=nullptr,"Cannot create inspector job");
 JOBOBJECT_EXTENDED_LIMIT_INFORMATION info{};info.BasicLimitInformation.LimitFlags=JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE|JOB_OBJECT_LIMIT_PROCESS_MEMORY|JOB_OBJECT_LIMIT_ACTIVE_PROCESS|JOB_OBJECT_LIMIT_PROCESS_TIME;
 info.BasicLimitInformation.ActiveProcessLimit=1;info.BasicLimitInformation.PerProcessUserTimeLimit.QuadPart=150000000;info.ProcessMemoryLimit=1536ull*1024*1024;
 require(SetInformationJobObject(job,JobObjectExtendedLimitInformation,&info,sizeof(info))&&AssignProcessToJobObject(job,GetCurrentProcess()),"Cannot apply inspector job limits");
 // Kept alive until process exit. Closing a kill-on-close job containing ourselves ends the process.
}
std::string inspect(const wchar_t* path,const std::string& requested){
 Host host;Plugin p;
 SetDefaultDllDirectories(LOAD_LIBRARY_SEARCH_DEFAULT_DIRS);
 p.module=LoadLibraryExW(path,nullptr,LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR|LOAD_LIBRARY_SEARCH_DEFAULT_DIRS);require(p.module!=nullptr,"Plugin module could not be loaded");
 auto init=reinterpret_cast<bool(PLUGIN_API*)()>(GetProcAddress(p.module,"InitDll"));if(init){require(init(),"Plugin InitDll failed");p.entered=true;}
 auto getFactory=reinterpret_cast<GetFactoryProc>(GetProcAddress(p.module,"GetPluginFactory"));require(getFactory!=nullptr,"No VST3 factory export");
 p.factory=getFactory();require(p.factory!=nullptr,"Plugin factory unavailable");
 auto factory3=query<IPluginFactory3>(p.factory);if(factory3){factory3->setHostContext(static_cast<IHostApplication*>(&host));factory3->release();}
 PFactoryInfo factoryInfo{};require(p.factory->getFactoryInfo(&factoryInfo)==kResultOk,"Factory metadata unavailable");
 int32 count=p.factory->countClasses();require(count>0&&count<=256,"Invalid factory class count");
 std::vector<PClassInfo> classes;for(int32 i=0;i<count;i++){PClassInfo c{};if(p.factory->getClassInfo(i,&c)==kResultOk&&string8(c.category,32)=="Audio Module Class")classes.push_back(c);}
 require(!classes.empty(),"No audio component classes found");
 if(requested.empty()&&classes.size()>1){std::ostringstream out;out<<"{\"inspectionVersion\":1,\"status\":\"choose-class\",\"vendor\":"<<quote(string8(factoryInfo.vendor,64))<<",\"classes\":[";for(size_t i=0;i<classes.size();i++){if(i)out<<',';out<<"{\"classId\":"<<quote(uid(classes[i].cid))<<",\"name\":"<<quote(string8(classes[i].name,64))<<'}';}out<<"]}";return out.str();}
 auto it=std::find_if(classes.begin(),classes.end(),[&](const PClassInfo& c){return requested.empty()||uid(c.cid)==requested;});require(it!=classes.end(),"Requested component class not found");auto selected=*it;
 require(p.factory->createInstance(selected.cid,IComponent_iid,reinterpret_cast<void**>(&p.component))==kResultOk&&p.component,"Cannot create plugin component");
 require(p.component->initialize(static_cast<IHostApplication*>(&host))==kResultOk,"Plugin component initialization failed");p.componentReady=true;
 p.controller=query<IEditController>(p.component);
 if(!p.controller){TUID controllerId{};require(p.component->getControllerClassId(controllerId)==kResultOk,"Plugin has no controller class");require(p.factory->createInstance(controllerId,IEditController_iid,reinterpret_cast<void**>(&p.controller))==kResultOk&&p.controller,"Cannot create edit controller");p.ownController=true;require(p.controller->initialize(static_cast<IHostApplication*>(&host))==kResultOk,"Controller initialization failed");}
 p.controllerReady=true;require(p.controller->setComponentHandler(&host)==kResultOk,"Controller rejected component handler");
 if(p.ownController){p.pc=query<IConnectionPoint>(p.component);p.cc=query<IConnectionPoint>(p.controller);if(p.pc&&p.cc){require(p.pc->connect(p.cc)==kResultOk&&p.cc->connect(p.pc)==kResultOk,"Component/controller connection failed");}Stream state;if(p.component->getState(&state)==kResultOk){state.position=0;p.controller->setComponentState(&state);}}
 int32 total=p.controller->getParameterCount();require(total>=0&&total<=16384,"Parameter count exceeds inspector limit");
 std::ostringstream out;out<<"{\"inspectionVersion\":1,\"status\":\"ok\",\"vendor\":"<<quote(string8(factoryInfo.vendor,64))<<",\"name\":"<<quote(string8(selected.name,64))<<",\"classId\":"<<quote(uid(selected.cid))<<",\"parameters\":[";
 std::map<ParamID,bool> seen;
 for(int32 i=0;i<total;i++){
  ParameterInfo info{};require(p.controller->getParameterInfo(i,info)==kResultOk,"Parameter metadata query failed");require(!seen[info.id],"Duplicate native parameter ID");seen[info.id]=true;
  bool validDefault=std::isfinite(info.defaultNormalizedValue)&&info.defaultNormalizedValue>=0&&info.defaultNormalizedValue<=1&&info.stepCount>=0;
  String128 display{};auto displayOk=validDefault&&p.controller->getParamStringByValue(info.id,info.defaultNormalizedValue,display)==kResultOk;
  if(i)out<<',';out<<"{\"id\":"<<info.id<<",\"index\":"<<i<<",\"name\":"<<quote(string16(info.title))<<",\"shortName\":"<<quote(string16(info.shortTitle))<<",\"unit\":"<<quote(string16(info.units))<<",\"stepCount\":"<<info.stepCount<<",\"defaultNormalized\":"<<(validDefault?numeric(info.defaultNormalizedValue):"null")<<",\"metadataValid\":"<<(validDefault?"true":"false")<<",\"reportedDefaultNormalized\":"<<numeric(info.defaultNormalizedValue)<<",\"defaultDisplay\":"<<(displayOk?quote(string16(display)):"null")<<",\"plainMin\":"<<numeric(p.controller->normalizedParamToPlain(info.id,0))<<",\"plainMax\":"<<numeric(p.controller->normalizedParamToPlain(info.id,1))<<",\"unitId\":"<<info.unitId<<",\"flags\":"<<info.flags<<",\"enumLabels\":[";
  if(info.stepCount>0&&info.stepCount<=32){for(int32 j=0;j<=info.stepCount;j++){String128 label{};if(j)out<<',';out<<(p.controller->getParamStringByValue(info.id,double(j)/info.stepCount,label)==kResultOk?quote(string16(label)):"null");}}
  out<<"]}";
 }
 out<<"]}";return out.str();
}
}
int wmain(int argc,wchar_t** argv){
 HANDLE protocol=nullptr;DuplicateHandle(GetCurrentProcess(),GetStdHandle(STD_OUTPUT_HANDLE),GetCurrentProcess(),&protocol,0,FALSE,DUPLICATE_SAME_ACCESS);
 _dup2(_fileno(stderr),_fileno(stdout));SetStdHandle(STD_OUTPUT_HANDLE,GetStdHandle(STD_ERROR_HANDLE));
 SetErrorMode(SEM_FAILCRITICALERRORS|SEM_NOGPFAULTERRORBOX|SEM_NOOPENFILEERRORBOX);
 std::string response;int result=0;
 try{require(argc==2||argc==3,"Expected absolute plugin binary path and optional component class ID");limits();auto com=CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED);require(SUCCEEDED(com),"Cannot initialize COM");response=inspect(argv[1],argc==3?utf8(argv[2],static_cast<int>(wcslen(argv[2]))):"");CoUninitialize();}
 catch(const std::exception& error){result=1;response="{\"inspectionVersion\":1,\"status\":\"error\",\"error\":"+quote(error.what())+"}";}
 response+='\n';if(protocol){size_t pos=0;while(pos<response.size()){DWORD written=0;if(!WriteFile(protocol,response.data()+pos,static_cast<DWORD>(response.size()-pos),&written,nullptr)||!written)break;pos+=written;}CloseHandle(protocol);}return result;
}
