export function replaceImportsPlugin() {
  return {
    name: 'replace-imports',
    transform(code, id) {
      if (id.includes('client/src') && (id.endsWith('.ts') || id.endsWith('.tsx'))) {
        // Replace API imports
        code = code.replace(
          /from ["']@\/lib\/api["']/g,
          'from "@/lib/api.gh-pages"'
        );

        // Replace config imports
        code = code.replace(
          /from ["']@\/lib\/config["']/g,
          'from "@/lib/config.gh-pages"'
        );

        // Replace logo imports  
        code = code.replace(
          /from ["']@\/assets\/logo["']/g,
          'from "@/assets/logo.gh-pages"'
        );

        // Replace constants imports
        code = code.replace(
          /from ["']@\/lib\/constants["']/g,
          'from "@/lib/constants.gh-pages"'
        );

        // Replace image helper imports
        code = code.replace(
          /from ["']@\/lib\/image-helper["']/g,
          'from "@/lib/image-helper.gh-pages"'
        );
      }
      return code;
    }
  };
}