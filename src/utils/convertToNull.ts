const emptyToNull = (val: any) => {
        if (val === undefined || val === null) return null;
      
        if (typeof val === "string") {
          const withoutPTags = val.replace(/<\/?p[^>]*>/gi, "");
          const textOnly = withoutPTags.replace(/<[^>]*>/g, "").trim();

          if (
            textOnly === "" ||
            textOnly.toLowerCase() === "null"
          ) {
            return null;
          }
        }
        return val;   
};
  
export default emptyToNull;